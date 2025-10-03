import axiosInstance from "../axios";

export interface Agent {
  _id: string;
  agentId: string;
  agentName: string;
  slug: string;
  assignedAt: string;
  createdAt: string;
  updatedAt: string;
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

export interface AgentWithLLMResponse {
  agent: Agent;
  agentDetails: RetellAgentDetails;
  llmDetails?: RetellLLMDetails;
}

class AgentAPI {
  private basePath = "/client/agents";

  async getAssignedAgents(): Promise<Agent[]> {
    const response = await axiosInstance.get(this.basePath);
    return response.data.data.agents;
  }

  async getAgentWithLLM(agentId: string): Promise<AgentWithLLMResponse> {
    const response = await axiosInstance.get(`${this.basePath}/${agentId}`);
    return response.data.data;
  }
}

export const agentAPI = new AgentAPI();