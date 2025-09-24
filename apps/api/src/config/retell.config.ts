export interface RetellConfig {
  apiKey: string;
  webhookSecret: string;
  baseUrl: string;
  defaultVoiceId: string;
  defaultSystemPrompt: string;
  webhook: {
    endpoint: string;
    events: string[];
    verifySignature: boolean;
  };
  limits: {
    maxCallDuration: number; // in minutes
    maxConcurrentCalls: number;
    maxKnowledgeBaseSize: number; // in MB
    maxBatchCallSize: number;
  };
  pricing: {
    baseCostPerMinute: number; // USD
    knowledgeBaseCostPerMB: number; // USD
    agentCreationCost: number; // USD
  };
}

export const retellConfig: RetellConfig = {
  apiKey: process.env.RETELL_API_KEY || "",
  webhookSecret: process.env.RETELL_WEBHOOK_SECRET || "",
  baseUrl: process.env.RETELL_BASE_URL || "https://api.retellai.com",
  defaultVoiceId: process.env.RETELL_DEFAULT_VOICE_ID || "11labs-adriana",
  defaultSystemPrompt: process.env.RETELL_DEFAULT_SYSTEM_PROMPT || `
    You are a professional phone agent representing our company.
    Be friendly, professional, and helpful in all interactions.
    Keep conversations focused and concise.
    Always ask for permission before taking any actions.
  `.trim(),
  webhook: {
    endpoint: process.env.RETELL_WEBHOOK_ENDPOINT || "/api/v1/webhooks/retell",
    events: [
      "call_started",
      "call_ended",
      "call_analyzed",
      "agent_response",
      "user_speech",
      "call_disconnected"
    ],
    verifySignature: process.env.NODE_ENV === "production",
  },
  limits: {
    maxCallDuration: parseInt(process.env.RETELL_MAX_CALL_DURATION || "30"), // 30 minutes
    maxConcurrentCalls: parseInt(process.env.RETELL_MAX_CONCURRENT_CALLS || "100"),
    maxKnowledgeBaseSize: parseInt(process.env.RETELL_MAX_KB_SIZE || "100"), // 100MB
    maxBatchCallSize: parseInt(process.env.RETELL_MAX_BATCH_SIZE || "1000"),
  },
  pricing: {
    baseCostPerMinute: parseFloat(process.env.RETELL_BASE_COST_PER_MINUTE || "0.05"),
    knowledgeBaseCostPerMB: parseFloat(process.env.RETELL_KB_COST_PER_MB || "0.10"),
    agentCreationCost: parseFloat(process.env.RETELL_AGENT_CREATION_COST || "1.00"),
  },
};

export const validateRetellConfig = (): string[] => {
  const errors: string[] = [];

  if (!retellConfig.apiKey) {
    errors.push("RETELL_API_KEY environment variable is required");
  }

  if (!retellConfig.webhookSecret && retellConfig.webhook.verifySignature) {
    errors.push("RETELL_WEBHOOK_SECRET environment variable is required for production");
  }

  if (retellConfig.limits.maxCallDuration <= 0) {
    errors.push("RETELL_MAX_CALL_DURATION must be greater than 0");
  }

  if (retellConfig.limits.maxConcurrentCalls <= 0) {
    errors.push("RETELL_MAX_CONCURRENT_CALLS must be greater than 0");
  }

  if (retellConfig.pricing.baseCostPerMinute < 0) {
    errors.push("RETELL_BASE_COST_PER_MINUTE must be non-negative");
  }

  return errors;
};

export const getRetellConfig = (): RetellConfig => {
  const errors = validateRetellConfig();

  if (errors.length > 0) {
    console.error("Retell configuration errors:");
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error("Invalid Retell configuration");
  }

  return retellConfig;
};

export default retellConfig;