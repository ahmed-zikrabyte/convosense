import Campaign, {ICampaign} from "../../../../models/campaign.model";
import AppError from "../../../../utils/AppError";
import {
  RetellService,
  RetellCreateKnowledgeBaseRequest,
  RetellCreateAgentRequest,
} from "../retell/retell.service";

export interface CreateCampaignData {
  name: string;
  script_raw: string;
  voice_id: string;
  settings?: Partial<ICampaign["settings"]>;
  kb_files_meta?: ICampaign["kb_files_meta"];
}

export interface UpdateCampaignData {
  name?: string;
  script_raw?: string;
  voice_id?: string;
  settings?: Partial<ICampaign["settings"]>;
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

      try {
        await this.integrateWithRetell(campaign);
      } catch (retellError) {
        console.error(
          "Retell integration failed, but campaign was saved:",
          retellError
        );
      }

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
        script_raw: originalCampaign.script_raw,
        kb_files_meta: originalCampaign.kb_files_meta,
        voice_id: originalCampaign.voice_id,
        settings: originalCampaign.settings,
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

  async updateKnowledgeBase(
    clientId: string,
    campaignId: string,
    kbFiles: ICampaign["kb_files_meta"]
  ): Promise<ICampaign> {
    try {
      const campaign = await Campaign.findOneAndUpdate(
        {campaignId, clientId},
        {$set: {kb_files_meta: kbFiles}},
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
      throw new AppError("Failed to update knowledge base", 500);
    }
  }

  async getCampaignStats(clientId: string): Promise<{
    total: number;
    draft: number;
    active: number;
    paused: number;
    completed: number;
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
        active: 0,
        paused: 0,
        completed: 0,
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

  private async integrateWithRetell(campaign: ICampaign): Promise<void> {
    let knowledgeBaseId: string | undefined;
    let agentId: string | undefined;

    try {
      if (campaign.kb_files_meta && campaign.kb_files_meta.length > 0) {
        knowledgeBaseId = await this.createRetellKnowledgeBase(campaign);
      }
      agentId = await this.createRetellAgent(campaign, knowledgeBaseId);

      await Campaign.findByIdAndUpdate(campaign._id, {
        knowledge_base_id: knowledgeBaseId,
        agent_id: agentId,
      });
    } catch (error) {
      if (knowledgeBaseId) {
        try {
          await this.retellService.deleteKnowledgeBase(knowledgeBaseId);
        } catch (cleanupError) {
          console.error("Failed to cleanup knowledge base:", cleanupError);
        }
      }
      if (agentId) {
        try {
          await this.retellService.deleteAgent(agentId);
        } catch (cleanupError) {
          console.error("Failed to cleanup agent:", cleanupError);
        }
      }
      throw error;
    }
  }

  private async createRetellKnowledgeBase(
    campaign: ICampaign
  ): Promise<string> {
    const kbRequest: RetellCreateKnowledgeBaseRequest = {
      knowledge_base_name: `KB_${campaign.campaignId}`,
      knowledge_base_files:
        campaign.kb_files_meta?.map((file) => ({
          type: "file" as const,
          content: file.fileUrl || "",
          name: file.fileName,
        })) || [],
    };

    const result = await this.retellService.createKnowledgeBase(kbRequest);
    return result.knowledge_base_id;
  }

  private async createRetellAgent(
    campaign: ICampaign,
    knowledgeBaseId?: string
  ): Promise<string> {
    const agentRequest: RetellCreateAgentRequest = {
      agent_name: `Agent_${campaign.campaignId}`,
      voice_id: campaign.voice_id,
      system_prompt: campaign.script_raw,
      knowledge_base_id: knowledgeBaseId,
      llm_websocket_url: campaign.settings.webhook_url,
    };

    const result = await this.retellService.createAgent(agentRequest);
    return result.agent_id;
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

      const publishResult = await this.retellService.publishAgent(
        campaign.agent_id
      );

      const updatedCampaign = await Campaign.findByIdAndUpdate(
        campaign._id,
        {
          published_version: publishResult.version,
          status: "active",
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

      if (campaign.agent_id && (updateData.script_raw || updateData.voice_id)) {
        const agentUpdates: Partial<RetellCreateAgentRequest> = {};

        if (updateData.voice_id) {
          agentUpdates.voice_id = updateData.voice_id;
        }
        if (updateData.script_raw) {
          agentUpdates.system_prompt = updateData.script_raw;
        }

        await this.retellService.updateAgent(campaign.agent_id, agentUpdates);
      }

      const updatedCampaign = await Campaign.findOneAndUpdate(
        {campaignId, clientId},
        {$set: updateData},
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
