import {Retell} from "retell-sdk";

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
      console.log({
        client: this.client,
        knowledge_base_name: request.knowledge_base_name,
        knowledge_base_files: request.knowledge_base_files,
      });
      // const response = await this.client.knowledgeBase.create({
      //   knowledge_base_name: request.knowledge_base_name,
      //   knowledge_base_files: request.knowledge_base_files,
      // });
      const response = await this.client.knowledgeBase.create({
        knowledge_base_name: "Sample KB1",
        knowledge_base_texts: [
          {
            text: "Hello, how are you?",
            title: "Sample Question",
          },
        ],
        knowledge_base_urls: [
          "https://www.retellai.com",
          "https://docs.retellai.com",
        ],
      });
      return response;
    } catch (error) {
      console.error(
        "@retell.service @63 Failed to create knowledge base:",
        error
      );
      throw error;
    }
  }

  async updateKnowledgeBase(
    _knowledgeBaseId: string,
    _request: RetellCreateKnowledgeBaseRequest
  ) {
    try {
      // Note: Update method may not be available in current SDK version
      // This is a placeholder for future SDK updates
      console.warn(
        "Knowledge base update not available in current SDK version"
      );
      return null;
    } catch (error) {
      console.error("Failed to update knowledge base:", error);
      throw error;
    }
  }

  async createAgent(request: RetellCreateAgentRequest) {
    try {
      let responseEngine;

      console.log({request});

      if (request.llm_websocket_url) {
        responseEngine = {
          type: "custom-llm" as const,
          llm_websocket_url: request.llm_websocket_url,
        };
      } else {
        const llm = await this.createDefaultLLM(request);
        responseEngine = {
          type: "retell-llm" as const,
          llm_id: llm.llm_id,
        };
      }

      console.log({
        agent_name: request.agent_name,
        voice_id: request.voice_id,
        response_engine: responseEngine,
      });

      const response = await this.client.agent.create({
        agent_name: request.agent_name,
        voice_id: request.voice_id,
        response_engine: responseEngine,
      });
      return response;
    } catch (error) {
      console.error("Failed to create agent:", error);
      throw error;
    }
  }

  private async createDefaultLLM(request: RetellCreateAgentRequest) {
    try {
      const llmRequest = {
        general_prompt:
          request.system_prompt || "You are a helpful AI assistant.",
        knowledge_base_ids: request.knowledge_base_id
          ? [request.knowledge_base_id]
          : [],
      };

      const llm = await this.client.llm.create(llmRequest);
      return llm;
    } catch (error) {
      console.error("Failed to create default LLM:", error);
      throw error;
    }
  }

  async updateAgent(
    agentId: string,
    request: Partial<RetellCreateAgentRequest>
  ) {
    try {
      const updateData: any = {};
      if (request.agent_name) updateData.agent_name = request.agent_name;
      if (request.voice_id) updateData.voice_id = request.voice_id;
      if (request.system_prompt)
        updateData.system_prompt = request.system_prompt;
      if (request.knowledge_base_id)
        updateData.knowledge_base_id = request.knowledge_base_id;
      if (request.llm_websocket_url)
        updateData.llm_websocket_url = request.llm_websocket_url;

      const response = await this.client.agent.update(agentId, updateData);
      return response;
    } catch (error) {
      console.error("Failed to update agent:", error);
      throw error;
    }
  }

  async publishAgent(agentId: string) {
    try {
      console.log("Publishing agent:", agentId);
      const response = await this.client.agent.publish(agentId);
      console.log("Agent published successfully:", response);
      return response;
    } catch (error) {
      console.error("Failed to publish agent:", error);
      console.error(
        "Error details:",
        error instanceof Error ? error.message : error
      );
      throw error;
    }
  }

  async getAgentVersionBeforePublish(agentId: string) {
    try {
      // Get the current agent to find its version before publishing
      console.log("Getting agent version for:", agentId);
      const agent = await this.client.agent.retrieve(agentId);
      console.log("Agent details:", {
        id: agent.agent_id,
        version: agent.version,
        last_modification_timestamp: agent.last_modification_timestamp,
        published_version: (agent as any).published_version || "not found",
        full_agent: agent,
      });
      return agent.version || 0;
    } catch (error) {
      console.error("Failed to get agent version:", error);
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

  async updatePhoneNumber(
    phoneNumberId: string,
    request: Partial<RetellCreatePhoneNumberRequest>
  ) {
    try {
      const updateData: any = {};
      if (request.inbound_agent_id)
        updateData.inbound_agent_id = request.inbound_agent_id;
      if (request.outbound_agent_id)
        updateData.outbound_agent_id = request.outbound_agent_id;

      const response = await this.client.phoneNumber.update(
        phoneNumberId,
        updateData
      );
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
      return {calls};
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

  async getCallDetails(callId: string) {
    try {
      const response = await this.client.call.retrieve(callId);
      return response;
    } catch (error) {
      console.error("Failed to get call details:", error);
      throw error;
    }
  }

  async listCalls(params?: {limit?: number}) {
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

  async listCallsByBatchId(batchCallId: string) {
    try {
      console.log(
        "🔍 [RetellService] Listing calls for batch_call_id:",
        batchCallId
      );

      const requestPayload = {
        filter_criteria: {
          batch_call_id: [batchCallId],
        },
      };
      console.log(
        "📤 [RetellService] Request payload:",
        JSON.stringify(requestPayload, null, 2)
      );

      const response = await this.client.call.list(requestPayload);

      console.log(
        "📦 [RetellService] Raw response:",
        JSON.stringify(response, null, 2)
      );
      console.log("🔧 [RetellService] Response type:", typeof response);
      console.log("🗂️ [RetellService] Response keys:", Object.keys(response));
      console.log(
        "📊 [RetellService] Is response an array?",
        Array.isArray(response)
      );

      // Try different possible response structures
      let calls = [];
      if (Array.isArray(response)) {
        calls = response;
        console.log("✅ [RetellService] Response is directly an array");
      } else if ((response as any).calls) {
        calls = (response as any).calls;
        console.log("✅ [RetellService] Found calls in response.calls");
      } else if ((response as any).data) {
        calls = (response as any).data;
        console.log("✅ [RetellService] Found calls in response.data");
      } else {
        console.log("❌ [RetellService] No calls found in response structure");
        calls = [];
      }

      console.log("📋 [RetellService] Final calls array length:", calls.length);

      if (calls.length > 0) {
        console.log("📝 [RetellService] Sample call structure:");
        console.log("   First call keys:", Object.keys(calls[0]));
        console.log("   First call:", JSON.stringify(calls[0], null, 2));
      }

      return calls;
    } catch (error: any) {
      console.error(
        "❌ [RetellService] Failed to list calls by batch ID:",
        error
      );
      console.error("❌ [RetellService] Error details:", error?.message);
      console.error("❌ [RetellService] Error stack:", error?.stack);
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
      const response =
        await this.client.knowledgeBase.retrieve(knowledgeBaseId);
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

  async deleteAgent(agentId: string) {
    try {
      await this.client.agent.delete(agentId);
    } catch (error) {
      console.error("Failed to delete agent:", error);
      throw error;
    }
  }

  async deleteKnowledgeBase(knowledgeBaseId: string) {
    try {
      await this.client.knowledgeBase.delete(knowledgeBaseId);
    } catch (error) {
      console.error("Failed to delete knowledge base:", error);
      throw error;
    }
  }

  async getLLM(llmId: string) {
    try {
      const response = await this.client.llm.retrieve(llmId);
      return response;
    } catch (error) {
      console.error("Failed to get LLM:", error);
      throw error;
    }
  }

  async updateLLM(llmId: string, updateData: {general_prompt?: string}) {
    try {
      const response = await this.client.llm.update(llmId, updateData);
      return response;
    } catch (error) {
      console.error("Failed to update LLM:", error);
      throw error;
    }
  }

  async getVoice(voiceId: string) {
    try {
      const response = await this.client.voice.retrieve(voiceId);
      return response;
    } catch (error) {
      console.error("Failed to get voice:", error);
      throw error;
    }
  }

  verifyWebhookSignature(
    payload: string,
    signature: string,
    _timestamp: string
  ): boolean {
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
