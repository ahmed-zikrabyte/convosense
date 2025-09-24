import { Retell } from "retell-sdk";

export interface RetellKnowledgeBaseFile {
  type: "url" | "text" | "file";
  content: string;
  name?: string;
}

export interface RetellCreateKnowledgeBaseRequest {
  knowledge_base_name: string;
  knowledge_base_files: RetellKnowledgeBaseFile[];
}

export interface RetellCreateAgentRequest {
  agent_name: string;
  voice_id: string;
  system_prompt: string;
  knowledge_base_id?: string;
  llm_websocket_url?: string;
  response_engine?: object;
}

export interface RetellCreatePhoneNumberRequest {
  phone_number: string;
  phone_number_pretty: string;
  area_code?: string;
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
        knowledge_base_files: request.knowledge_base_files.map(file => ({
          type: file.type as "url" | "text" | "file",
          content: file.content,
          name: file.name,
        })),
      });
      return response;
    } catch (error) {
      console.error("Failed to create knowledge base:", error);
      throw error;
    }
  }

  async updateKnowledgeBase(knowledgeBaseId: string, request: RetellCreateKnowledgeBaseRequest) {
    try {
      const response = await this.client.knowledgeBase.update(knowledgeBaseId, {
        knowledge_base_name: request.knowledge_base_name,
        knowledge_base_files: request.knowledge_base_files.map(file => ({
          type: file.type as "url" | "text" | "file",
          content: file.content,
          name: file.name,
        })),
      });
      return response;
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
        system_prompt: request.system_prompt,
        knowledge_base_id: request.knowledge_base_id,
        llm_websocket_url: request.llm_websocket_url,
        response_engine: request.response_engine,
      });
      return response;
    } catch (error) {
      console.error("Failed to create agent:", error);
      throw error;
    }
  }

  async updateAgent(agentId: string, request: Partial<RetellCreateAgentRequest>) {
    try {
      const response = await this.client.agent.update(agentId, {
        agent_name: request.agent_name,
        voice_id: request.voice_id,
        system_prompt: request.system_prompt,
        knowledge_base_id: request.knowledge_base_id,
        llm_websocket_url: request.llm_websocket_url,
        response_engine: request.response_engine,
      });
      return response;
    } catch (error) {
      console.error("Failed to update agent:", error);
      throw error;
    }
  }

  async publishAgent(agentId: string) {
    try {
      const response = await this.client.agent.update(agentId, {
        last_modification_timestamp: Date.now(),
      });
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
        phone_number_pretty: request.phone_number_pretty,
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
      const response = await this.client.phoneNumber.update(phoneNumberId, {
        phone_number: request.phone_number,
        phone_number_pretty: request.phone_number_pretty,
        area_code: request.area_code,
        inbound_agent_id: request.inbound_agent_id,
        outbound_agent_id: request.outbound_agent_id,
      });
      return response;
    } catch (error) {
      console.error("Failed to update phone number:", error);
      throw error;
    }
  }

  async createBatchCall(request: RetellBatchCallRequest) {
    try {
      const response = await this.client.call.createBatch({
        from_number: request.from_number,
        to_numbers: request.to_numbers,
        agent_id: request.agent_id,
        override_agent_id: request.override_agent_id,
        retell_llm_dynamic_variables: request.retell_llm_dynamic_variables,
      });
      return response;
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

  async listCalls(params?: { limit?: number; offset?: number }) {
    try {
      const response = await this.client.call.list({
        limit: params?.limit,
        offset: params?.offset,
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

      return this.client.verify(payload, signature, secret, timestamp);
    } catch (error) {
      console.error("Failed to verify webhook signature:", error);
      return false;
    }
  }
}

export default RetellService;