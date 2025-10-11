import Call, { ICall } from "../../../../models/call.model";
import Campaign from "../../../../models/campaign.model";
import CampaignContact from "../../../../models/campaign-contact.model";
import AppError from "../../../../utils/AppError";

export interface CallReportsFilters {
  campaign_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface CallReportsStats {
  total_calls: number;
  completed_calls: number;
  failed_calls: number;
  total_duration: number;
  total_cost: number;
  average_duration: number;
  success_rate: number;
  by_status: {
    [key: string]: number;
  };
  by_outcome: {
    [key: string]: number;
  };
}

class CallReportsService {
  async getCallReports(
    clientId: string,
    filters: CallReportsFilters = {}
  ): Promise<{
    calls: ICall[];
    total: number;
    currentPage: number;
    totalPages: number;
    stats: CallReportsStats;
  }> {
    try {
      const {
        campaign_id,
        status,
        start_date,
        end_date,
        page = 1,
        limit = 20,
        search,
      } = filters;

      // Build query to ensure we only get calls for campaigns owned by this client
      const campaignQuery: any = { clientId };
      if (campaign_id) {
        campaignQuery.campaignId = campaign_id;
      }

      const campaigns = await Campaign.find(campaignQuery).select("campaignId");
      const campaignIds = campaigns.map((c) => c.campaignId);

      const query: any = { campaign_id: { $in: campaignIds } };

      if (status) {
        query.status = status;
      }

      if (start_date || end_date) {
        query.createdAt = {};
        if (start_date) {
          query.createdAt.$gte = new Date(start_date);
        }
        if (end_date) {
          query.createdAt.$lte = new Date(end_date);
        }
      }

      if (search) {
        query.$or = [
          { to: { $regex: search, $options: "i" } },
          { transcript: { $regex: search, $options: "i" } },
          { "call_analysis.summary": { $regex: search, $options: "i" } },
        ];
      }

      const skip = (page - 1) * limit;

      // Get calls with pagination
      const [calls, total] = await Promise.all([
        Call.find(query)
          .populate("campaign_contact_id", "dynamic_variables")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Call.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      // Calculate stats
      const stats = await this.calculateCallStats(query);

      return {
        calls: calls as ICall[],
        total,
        currentPage: page,
        totalPages,
        stats,
      };
    } catch (error) {
      console.error("Failed to get call reports:", error);
      throw new AppError("Failed to fetch call reports", 500);
    }
  }

  async getCallReportById(
    clientId: string,
    callId: string
  ): Promise<ICall> {
    try {
      // Verify the call belongs to a campaign owned by this client
      const campaignQuery = { clientId };
      const campaigns = await Campaign.find(campaignQuery).select("campaignId");
      const campaignIds = campaigns.map((c) => c.campaignId);

      const call = await Call.findOne({
        call_id: callId,
        campaign_id: { $in: campaignIds },
      })
        .populate("campaign_contact_id", "dynamic_variables phone_number")
        .lean();

      if (!call) {
        throw new AppError("Call report not found", 404);
      }

      return call as ICall;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Failed to get call report:", error);
      throw new AppError("Failed to fetch call report", 500);
    }
  }

  async getCallReportsByCampaign(
    clientId: string,
    campaignId: string,
    filters: Omit<CallReportsFilters, "campaign_id"> = {}
  ): Promise<{
    calls: ICall[];
    total: number;
    currentPage: number;
    totalPages: number;
    stats: CallReportsStats;
  }> {
    try {
      // Verify campaign belongs to client
      const campaign = await Campaign.findOne({
        campaignId,
        clientId,
      });

      if (!campaign) {
        throw new AppError("Campaign not found", 404);
      }

      return await this.getCallReports(clientId, {
        ...filters,
        campaign_id: campaignId,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Failed to get campaign call reports:", error);
      throw new AppError("Failed to fetch campaign call reports", 500);
    }
  }

  async getCallTranscript(
    clientId: string,
    callId: string
  ): Promise<{
    transcript: string;
    transcript_object: any[];
  }> {
    try {
      const call = await this.getCallReportById(clientId, callId);

      return {
        transcript: call.transcript || "",
        transcript_object: call.transcript_object || [],
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Failed to get call transcript:", error);
      throw new AppError("Failed to fetch call transcript", 500);
    }
  }

  async getCallRecording(
    clientId: string,
    callId: string
  ): Promise<{
    recording_url?: string;
    recording_multi_channel_url?: string;
  }> {
    try {
      const call = await this.getCallReportById(clientId, callId);

      return {
        recording_url: call.metadata.recording_url,
        recording_multi_channel_url: call.metadata.recording_multi_channel_url,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Failed to get call recording:", error);
      throw new AppError("Failed to fetch call recording", 500);
    }
  }

  private async calculateCallStats(query: any): Promise<CallReportsStats> {
    try {
      const [statsResult] = await Call.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            total_calls: { $sum: 1 },
            completed_calls: {
              $sum: {
                $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
              },
            },
            failed_calls: {
              $sum: {
                $cond: [
                  {
                    $in: ["$status", ["failed", "no_answer", "busy"]],
                  },
                  1,
                  0,
                ],
              },
            },
            total_duration: { $sum: "$duration_seconds" },
            total_cost: { $sum: "$client_cost" },
          },
        },
      ]);

      const [statusStats] = await Call.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            by_status: {
              $push: {
                k: "$_id",
                v: "$count",
              },
            },
          },
        },
        {
          $project: {
            by_status: { $arrayToObject: "$by_status" },
          },
        },
      ]);

      const [outcomeStats] = await Call.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$call_analysis.outcome",
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            by_outcome: {
              $push: {
                k: { $ifNull: ["$_id", "unknown"] },
                v: "$count",
              },
            },
          },
        },
        {
          $project: {
            by_outcome: { $arrayToObject: "$by_outcome" },
          },
        },
      ]);

      const stats = statsResult || {
        total_calls: 0,
        completed_calls: 0,
        failed_calls: 0,
        total_duration: 0,
        total_cost: 0,
      };

      return {
        total_calls: stats.total_calls,
        completed_calls: stats.completed_calls,
        failed_calls: stats.failed_calls,
        total_duration: stats.total_duration,
        total_cost: stats.total_cost,
        average_duration:
          stats.total_calls > 0
            ? Math.round(stats.total_duration / stats.total_calls)
            : 0,
        success_rate:
          stats.total_calls > 0
            ? Math.round((stats.completed_calls / stats.total_calls) * 100)
            : 0,
        by_status: statusStats?.by_status || {},
        by_outcome: outcomeStats?.by_outcome || {},
      };
    } catch (error) {
      console.error("Failed to calculate call stats:", error);
      return {
        total_calls: 0,
        completed_calls: 0,
        failed_calls: 0,
        total_duration: 0,
        total_cost: 0,
        average_duration: 0,
        success_rate: 0,
        by_status: {},
        by_outcome: {},
      };
    }
  }
}

export default new CallReportsService();