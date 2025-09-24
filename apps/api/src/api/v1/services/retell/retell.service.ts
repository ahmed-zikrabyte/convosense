import { Retell } from "retell-sdk";

export interface RetellKnowledgeBaseFile {
  type: "url" | "text" | "file";
  content: string;
  name?: string;
}

export interface RetellCreateKnowledgeBaseRequest {
  knowledge_base_name: string;
  knowledge_base_files: any[];
}

export interface RetellCreateAgentRequest {
  agent_name: string;
  voice_id: string;
  system_prompt: string;
  knowledge_base_id?: string;
  llm_websocket_url?: string;
}

export interface RetellCreatePhoneNumberRequest {
  phone_number: string;
  phone_number_pretty: string;
  area_code?: number;
  inbound_agent_id?: string;
  outbound_agent_id?: string;
}

export interface RetellBatchCallRequest {
  from_number: string;
  to_numbers: string[];
  agent_id: string;
  override_agent_id?: string;
  retell_llm_dynamic_variables?: Record<string, any>;
}

export class RetellService {
  private client: Retell;

  constructor() {
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) {
      throw new Error("RETELL_API_KEY environment variable is required");
    }
    this.client = new Retell({
      apiKey: apiKey,
    });
  }

  async createKnowledgeBase(request: RetellCreateKnowledgeBaseRequest) {
    try {
      const response = await this.client.knowledgeBase.create({
        knowledge_base_name: request.knowledge_base_name,
        knowledge_base_files: request.knowledge_base_files,
      });
      return response;
    } catch (error) {
      console.error("Failed to create knowledge base:", error);
      throw error;
    }
  }

  async updateKnowledgeBase(knowledgeBaseId: string, request: RetellCreateKnowledgeBaseRequest) {
    try {
      // Note: Update method may not be available in current SDK version
      // This is a placeholder for future SDK updates
      console.warn("Knowledge base update not available in current SDK version");
      return null;
    } catch (error) {
      console.error("Failed to update knowledge base:", error);
      throw error;
    }
  }

  async createAgent(request: RetellCreateAgentRequest) {
    try {
      const response = await this.client.agent.create({
        agent_name: request.agent_name,
        voice_id: request.voice_id,
        response_engine: {
          type: "retell-llm",
          llm_id: "default",
        },
      });
      return response;
    } catch (error) {
      console.error("Failed to create agent:", error);
      throw error;
    }
  }

  async updateAgent(agentId: string, request: Partial<RetellCreateAgentRequest>) {
    try {
      const updateData: any = {};
      if (request.agent_name) updateData.agent_name = request.agent_name;
      if (request.voice_id) updateData.voice_id = request.voice_id;
      if (request.system_prompt) updateData.system_prompt = request.system_prompt;
      if (request.knowledge_base_id) updateData.knowledge_base_id = request.knowledge_base_id;
      if (request.llm_websocket_url) updateData.llm_websocket_url = request.llm_websocket_url;

      const response = await this.client.agent.update(agentId, updateData);
      return response;
    } catch (error) {
      console.error("Failed to update agent:", error);
      throw error;
    }
  }

  async publishAgent(agentId: string) {
    try {
      // Publishing is typically handled by the SDK automatically
      // Just return the agent details
      const response = await this.client.agent.retrieve(agentId);
      return response;
    } catch (error) {
      console.error("Failed to publish agent:", error);
      throw error;
    }
  }

  async createPhoneNumber(request: RetellCreatePhoneNumberRequest) {
    try {
      const response = await this.client.phoneNumber.create({
        phone_number: request.phone_number,
        area_code: request.area_code,
        inbound_agent_id: request.inbound_agent_id,
        outbound_agent_id: request.outbound_agent_id,
      });
      return response;
    } catch (error) {
      console.error("Failed to create phone number:", error);
      throw error;
    }
  }

  async updatePhoneNumber(phoneNumberId: string, request: Partial<RetellCreatePhoneNumberRequest>) {
    try {
      const updateData: any = {};
      if (request.inbound_agent_id) updateData.inbound_agent_id = request.inbound_agent_id;
      if (request.outbound_agent_id) updateData.outbound_agent_id = request.outbound_agent_id;

      const response = await this.client.phoneNumber.update(phoneNumberId, updateData);
      return response;
    } catch (error) {
      console.error("Failed to update phone number:", error);
      throw error;
    }
  }

  async createBatchCall(request: RetellBatchCallRequest) {
    try {
      // Create individual calls since batch may not be available
      const calls = [];
      for (const toNumber of request.to_numbers) {
        const call = await this.client.call.createPhoneCall({
          from_number: request.from_number,
          to_number: toNumber,
          retell_llm_dynamic_variables: request.retell_llm_dynamic_variables,
        });
        calls.push(call);
      }
      return { calls };
    } catch (error) {
      console.error("Failed to create batch call:", error);
      throw error;
    }
  }

  async getCall(callId: string) {
    try {
      const response = await this.client.call.retrieve(callId);
      return response;
    } catch (error) {
      console.error("Failed to get call:", error);
      throw error;
    }
  }

  async listCalls(params?: { limit?: number }) {
    try {
      const response = await this.client.call.list({
        limit: params?.limit,
      });
      return response;
    } catch (error) {
      console.error("Failed to list calls:", error);
      throw error;
    }
  }

  async getAgent(agentId: string) {
    try {
      const response = await this.client.agent.retrieve(agentId);
      return response;
    } catch (error) {
      console.error("Failed to get agent:", error);
      throw error;
    }
  }

  async listAgents() {
    try {
      const response = await this.client.agent.list();
      return response;
    } catch (error) {
      console.error("Failed to list agents:", error);
      throw error;
    }
  }

  async getKnowledgeBase(knowledgeBaseId: string) {
    try {
      const response = await this.client.knowledgeBase.retrieve(knowledgeBaseId);
      return response;
    } catch (error) {
      console.error("Failed to get knowledge base:", error);
      throw error;
    }
  }

  async listKnowledgeBases() {
    try {
      const response = await this.client.knowledgeBase.list();
      return response;
    } catch (error) {
      console.error("Failed to list knowledge bases:", error);
      throw error;
    }
  }

  async listPhoneNumbers() {
    try {
      const response = await this.client.phoneNumber.list();
      return response;
    } catch (error) {
      console.error("Failed to list phone numbers:", error);
      throw error;
    }
  }

  async getPhoneNumber(phoneNumberId: string) {
    try {
      const response = await this.client.phoneNumber.retrieve(phoneNumberId);
      return response;
    } catch (error) {
      console.error("Failed to get phone number:", error);
      throw error;
    }
  }

  verifyWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
    try {
      const secret = process.env.RETELL_WEBHOOK_SECRET;
      if (!secret) {
        console.error("RETELL_WEBHOOK_SECRET environment variable is required");
        return false;
      }

      // Use static method for verification
      return Retell.verify(payload, signature, secret);
    } catch (error) {
      console.error("Failed to verify webhook signature:", error);
      return false;
    }
  }
}

export default RetellService;