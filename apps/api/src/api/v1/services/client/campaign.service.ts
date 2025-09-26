import Campaign, { ICampaign } from "../../../../models/campaign.model";
import AppError from "../../../../utils/AppError";

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
  async createCampaign(clientId: string, campaignData: CreateCampaignData): Promise<ICampaign> {
    try {
      const campaign = new Campaign({
        clientId,
        ...campaignData,
      });

      await campaign.save();
      return campaign;
    } catch (error) {
      if (error instanceof Error && error.name === "ValidationError") {
        throw new AppError(`Validation failed: ${error.message}`, 400);
      }
      throw new AppError("Failed to create campaign", 500);
    }
  }

  async getCampaigns(clientId: string, filters: CampaignFilters = {}): Promise<{
    campaigns: ICampaign[];
    total: number;
    currentPage: number;
    totalPages: number;
  }> {
    try {
      const {
        status,
        page = 1,
        limit = 10,
        search,
      } = filters;

      const query: any = { clientId };

      if (status) {
        query.status = status;
      }

      if (search) {
        query.name = { $regex: search, $options: "i" };
      }

      const skip = (page - 1) * limit;

      const [campaigns, total] = await Promise.all([
        Campaign.find(query)
          .sort({ createdAt: -1 })
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

  async getCampaignById(clientId: string, campaignId: string): Promise<ICampaign> {
    try {
      const campaign = await Campaign.findOne({
        campaignId,
        clientId
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
        { campaignId, clientId },
        { $set: updateData },
        { new: true, runValidators: true }
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
        clientId
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

  async duplicateCampaign(clientId: string, campaignId: string): Promise<ICampaign> {
    try {
      const originalCampaign = await Campaign.findOne({
        campaignId,
        clientId
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
        { campaignId, clientId },
        { $set: { kb_files_meta: kbFiles } },
        { new: true, runValidators: true }
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
        { $match: { clientId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
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
}

export default new CampaignService();