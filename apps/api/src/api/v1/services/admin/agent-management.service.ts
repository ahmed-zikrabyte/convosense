import Agent, { IAgent } from "../../../../models/agent.model";
import AppError from "../../../../utils/AppError";
import RetellService from "../retell/retell.service";

export interface AgentFilters {
  search?: string;
}

export interface AgentCreateData {
  agentId: string;
  agentName: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface RetellAgentDetails {
  agent_id: string;
  channel: string;
  last_modification_timestamp: number;
  agent_name: string;
  response_engine: {
    type: string;
    llm_id?: string;
    version?: number;
  };
  language: string;
  opt_out_sensitive_data_storage: boolean;
  data_storage_setting: string;
  opt_in_signed_url: boolean;
  end_call_after_silence_ms: number;
  version: number;
  is_published: boolean;
  post_call_analysis_model: string;
  pii_config: {
    mode: string;
    categories: string[];
  };
  voice_id: string;
  max_call_duration_ms: number;
  interruption_sensitivity: number;
  user_dtmf_options: Record<string, any>;
}

export interface RetellLLMDetails {
  llm_id: string;
  version: number;
  model: string;
  model_high_priority: boolean;
  general_prompt: string;
  general_tools: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  start_speaker: string;
  kb_config: {
    top_k: number;
    filter_score: number;
  };
  last_modification_timestamp: number;
  is_published: boolean;
}

export interface RetellVoiceDetails {
  voice_id: string;
  voice_name: string;
  provider: string;
  accent: string;
  gender: string;
  age: string;
  preview_audio_url: string;
}

class AgentManagementService {
  private retellService: RetellService;

  constructor() {
    this.retellService = new RetellService();
  }

  async getAllAgents(
    filters: AgentFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ) {
    const query: any = {};

    if (filters.search) {
      query.$or = [
        { agentName: { $regex: filters.search, $options: "i" } },
        { agentId: { $regex: filters.search, $options: "i" } },
        { slug: { $regex: filters.search, $options: "i" } }
      ];
    }

    const { page, limit, sortBy = "createdAt", sortOrder = "desc" } = pagination;
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [agents, totalCount] = await Promise.all([
      Agent.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Agent.countDocuments(query)
    ]);

    return {
      agents,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      }
    };
  }

  async getAgentById(agentDbId: string) {
    const agent = await Agent.findById(agentDbId);

    if (!agent) {
      throw new AppError("Agent not found", 404);
    }

    return agent.toJSON();
  }

  async getRetellAgentDetails(agentId: string): Promise<{
    agentDetails: RetellAgentDetails;
    llmDetails?: RetellLLMDetails;
  }> {
    try {
      const agentDetails = await this.retellService.getAgent(agentId) as RetellAgentDetails;

      let llmDetails: RetellLLMDetails | undefined;

      if (agentDetails.response_engine?.type === "retell-llm" && agentDetails.response_engine.llm_id) {
        try {
          llmDetails = await this.retellService.getLLM(agentDetails.response_engine.llm_id) as RetellLLMDetails;
        } catch (error) {
          console.warn(`Failed to fetch LLM details for ${agentDetails.response_engine.llm_id}:`, error);
        }
      }

      return {
        agentDetails,
        llmDetails
      };
    } catch (error) {
      console.error("Failed to get Retell agent details:", error);
      throw new AppError("Failed to fetch agent details from Retell", 500);
    }
  }

  async createAgent(agentData: AgentCreateData) {
    const existingAgent = await Agent.findOne({
      agentId: agentData.agentId
    });

    if (existingAgent) {
      throw new AppError("Agent with this ID already exists", 400);
    }

    try {
      await this.retellService.getAgent(agentData.agentId);
    } catch (error) {
      throw new AppError("Invalid agent ID or agent not found in Retell", 400);
    }

    const agent = new Agent({
      agentId: agentData.agentId,
      agentName: agentData.agentName
    });

    await agent.save();
    return agent.toJSON();
  }

  async deleteAgent(agentDbId: string) {
    const agent = await Agent.findById(agentDbId);
    if (!agent) {
      throw new AppError("Agent not found", 404);
    }

    await Agent.findByIdAndDelete(agentDbId);
    return { message: "Agent deleted successfully" };
  }

  async updateLLMPrompt(llmId: string, generalPrompt: string): Promise<RetellLLMDetails> {
    try {
      const response = await this.retellService.updateLLM(llmId, {
        general_prompt: generalPrompt
      });
      return response as RetellLLMDetails;
    } catch (error) {
      console.error("Failed to update LLM prompt:", error);
      throw new AppError("Failed to update LLM prompt", 500);
    }
  }

  async getVoiceDetails(voiceId: string): Promise<RetellVoiceDetails> {
    try {
      const response = await this.retellService.getVoice(voiceId);
      return response as RetellVoiceDetails;
    } catch (error) {
      console.error("Failed to get voice details:", error);
      throw new AppError("Failed to fetch voice details", 500);
    }
  }

  async getAgentStats() {
    const totalAgents = await Agent.countDocuments();

    return {
      totalAgents
    };
  }
}

export default new AgentManagementService();