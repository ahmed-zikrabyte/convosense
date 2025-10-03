import Campaign, {ICampaign} from "../../../../models/campaign.model";
import Agent from "../../../../models/agent.model";
import AppError from "../../../../utils/AppError";
import {
  RetellService,
} from "../retell/retell.service";
import agentManagementService from "../admin/agent-management.service";

export interface CreateCampaignData {
  name: string;
  agent_id: string;
  general_prompt: string;
}

export interface UpdateCampaignData {
  name?: string;
  general_prompt?: string;
  status?: ICampaign["status"];
}

export interface CampaignFilters {
  status?: string | undefined;
  page?: number;
  limit?: number;
  search?: string | undefined;
}

class CampaignService {
  private retellService: RetellService;

  constructor() {
    this.retellService = new RetellService();
  }

  async createAgentBasedCampaign(
    clientId: string,
    campaignData: CreateCampaignData
  ): Promise<ICampaign> {
    try {
      // Verify agent is assigned to this client
      const agent = await Agent.findOne({
        agentId: campaignData.agent_id,
        assignedClientId: clientId
      });

      if (!agent) {
        throw new AppError("Agent not found or not assigned to this client", 404);
      }

      // Check if agent is already used in another campaign
      const existingCampaign = await Campaign.findOne({
        clientId,
        agent_id: campaignData.agent_id
      });

      if (existingCampaign) {
        throw new AppError("This agent is already assigned to another campaign", 400);
      }

      // Get agent details to get LLM ID
      const { llmDetails } = await agentManagementService.getRetellAgentDetails(campaignData.agent_id);

      if (!llmDetails?.llm_id) {
        throw new AppError("Agent does not have an LLM configured", 400);
      }

      // Update LLM with the new general prompt first
      await agentManagementService.updateLLMPrompt(llmDetails.llm_id, campaignData.general_prompt);

      // Create campaign (status remains draft until published)
      const campaign = new Campaign({
        clientId,
        name: campaignData.name,
        agent_id: campaignData.agent_id,
        status: "draft"
      });

      await campaign.save();
      return campaign;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error && error.name === "ValidationError") {
        throw new AppError(`Validation failed: ${error.message}`, 400);
      }
      throw new AppError("Failed to create campaign", 500);
    }
  }
  async createCampaign(
    clientId: string,
    campaignData: CreateCampaignData
  ): Promise<ICampaign> {
    try {
      const campaign = new Campaign({
        clientId,
        ...campaignData,
      });

      await campaign.save();

      // Legacy method - no longer used with agent-based campaigns

      return campaign;
    } catch (error) {
      if (error instanceof Error && error.name === "ValidationError") {
        throw new AppError(`Validation failed: ${error.message}`, 400);
      }
      throw new AppError("Failed to create campaign", 500);
    }
  }

  async getCampaigns(
    clientId: string,
    filters: CampaignFilters = {}
  ): Promise<{
    campaigns: ICampaign[];
    total: number;
    currentPage: number;
    totalPages: number;
  }> {
    try {
      const {status, page = 1, limit = 10, search} = filters;

      const query: any = {clientId};

      if (status) {
        query.status = status;
      }

      if (search) {
        query.name = {$regex: search, $options: "i"};
      }

      const skip = (page - 1) * limit;

      const [campaigns, total] = await Promise.all([
        Campaign.find(query)
          .sort({createdAt: -1})
          .skip(skip)
          .limit(limit)
          .lean(),
        Campaign.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        campaigns: campaigns as ICampaign[],
        total,
        currentPage: page,
        totalPages,
      };
    } catch (error) {
      throw new AppError("Failed to fetch campaigns", 500);
    }
  }

  async getCampaignById(
    clientId: string,
    campaignId: string
  ): Promise<ICampaign> {
    try {
      const campaign = await Campaign.findOne({
        campaignId,
        clientId,
      }).lean();

      if (!campaign) {
        throw new AppError("Campaign not found", 404);
      }

      return campaign as ICampaign;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to fetch campaign", 500);
    }
  }

  async getCampaignWithGeneralPrompt(
    clientId: string,
    campaignId: string
  ): Promise<any> {
    try {
      const campaign = await this.getCampaignById(clientId, campaignId);

      if (!campaign.agent_id) {
        return campaign;
      }

      try {
        // Get agent details to find LLM ID
        const { llmDetails } = await agentManagementService.getRetellAgentDetails(campaign.agent_id);

        if (llmDetails?.llm_id) {
          // Get LLM details to get general prompt
          const llm = await this.retellService.getLLM(llmDetails.llm_id);
          const campaignData = campaign.toObject ? campaign.toObject() : campaign;
          return {
            ...campaignData,
            general_prompt: llm.general_prompt || undefined
          };
        }
      } catch (error) {
        console.error("Failed to fetch general prompt:", error);
        // Return campaign without general_prompt if we can't fetch it
      }

      return campaign.toObject ? campaign.toObject() : campaign;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to fetch campaign with general prompt", 500);
    }
  }

  async updateCampaign(
    clientId: string,
    campaignId: string,
    updateData: UpdateCampaignData
  ): Promise<ICampaign> {
    try {
      const campaign = await Campaign.findOneAndUpdate(
        {campaignId, clientId},
        {$set: updateData},
        {new: true, runValidators: true}
      );

      if (!campaign) {
        throw new AppError("Campaign not found", 404);
      }

      return campaign;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error && error.name === "ValidationError") {
        throw new AppError(`Validation failed: ${error.message}`, 400);
      }
      throw new AppError("Failed to update campaign", 500);
    }
  }

  async deleteCampaign(clientId: string, campaignId: string): Promise<void> {
    try {
      const campaign = await Campaign.findOneAndDelete({
        campaignId,
        clientId,
      });

      if (!campaign) {
        throw new AppError("Campaign not found", 404);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to delete campaign", 500);
    }
  }

  async duplicateCampaign(
    clientId: string,
    campaignId: string
  ): Promise<ICampaign> {
    try {
      const originalCampaign = await Campaign.findOne({
        campaignId,
        clientId,
      }).lean();

      if (!originalCampaign) {
        throw new AppError("Campaign not found", 404);
      }

      const duplicatedCampaign = new Campaign({
        clientId,
        name: `${originalCampaign.name} (Copy)`,
        agent_id: originalCampaign.agent_id,
        status: "draft",
      });

      await duplicatedCampaign.save();
      return duplicatedCampaign;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to duplicate campaign", 500);
    }
  }


  async getCampaignStats(clientId: string): Promise<{
    total: number;
    draft: number;
    published: number;
  }> {
    try {
      const stats = await Campaign.aggregate([
        {$match: {clientId}},
        {
          $group: {
            _id: "$status",
            count: {$sum: 1},
          },
        },
      ]);

      const result = {
        total: 0,
        draft: 0,
        published: 0,
      };

      stats.forEach((stat) => {
        result[stat._id as keyof typeof result] = stat.count;
        result.total += stat.count;
      });

      return result;
    } catch (error) {
      throw new AppError("Failed to fetch campaign stats", 500);
    }
  }



  async publishCampaign(
    clientId: string,
    campaignId: string
  ): Promise<ICampaign> {
    try {
      const campaign = await Campaign.findOne({campaignId, clientId});

      if (!campaign) {
        throw new AppError("Campaign not found", 404);
      }

      if (!campaign.agent_id) {
        throw new AppError(
          "Campaign must have an agent before publishing",
          400
        );
      }

      // Get the current agent version before publishing
      const currentVersion = await this.retellService.getAgentVersionBeforePublish(campaign.agent_id);
      console.log("Current agent version before publish:", currentVersion);

      // Publish the agent to Retell
      const publishResult = await agentManagementService.publishAgent(campaign.agent_id);
      console.log("Publish result:", publishResult);

      // Get the new version after publishing
      const newVersion = await this.retellService.getAgentVersionBeforePublish(campaign.agent_id);
      console.log("New agent version after publish:", newVersion);

      // Update campaign with published status and version
      const updatedCampaign = await Campaign.findByIdAndUpdate(
        campaign._id,
        {
          published_version: Math.max(newVersion, currentVersion + 1), // Use the higher version
          status: "published",
        },
        {new: true}
      );

      if (!updatedCampaign) {
        throw new AppError("Failed to update campaign after publishing", 500);
      }

      return updatedCampaign;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to publish campaign", 500);
    }
  }

  async updateCampaignWithRetell(
    clientId: string,
    campaignId: string,
    updateData: UpdateCampaignData
  ): Promise<ICampaign> {
    try {
      const campaign = await Campaign.findOne({campaignId, clientId});

      if (!campaign) {
        throw new AppError("Campaign not found", 404);
      }

      // If general_prompt is being updated, update the LLM in Retell
      if (campaign.agent_id && updateData.general_prompt) {
        // Get agent details to find LLM ID
        const { llmDetails } = await agentManagementService.getRetellAgentDetails(campaign.agent_id);

        if (llmDetails?.llm_id) {
          await agentManagementService.updateLLMPrompt(llmDetails.llm_id, updateData.general_prompt);
        }
      }

      // Only update the fields we store in MongoDB (exclude general_prompt)
      const mongoUpdateData: Partial<ICampaign> = {};
      if (updateData.name) mongoUpdateData.name = updateData.name;
      if (updateData.status) mongoUpdateData.status = updateData.status;

      const updatedCampaign = await Campaign.findOneAndUpdate(
        {campaignId, clientId},
        {$set: mongoUpdateData},
        {new: true, runValidators: true}
      );

      if (!updatedCampaign) {
        throw new AppError("Campaign not found", 404);
      }

      return updatedCampaign;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error && error.name === "ValidationError") {
        throw new AppError(`Validation failed: ${error.message}`, 400);
      }
      throw new AppError("Failed to update campaign", 500);
    }
  }
}

export default new CampaignService();
