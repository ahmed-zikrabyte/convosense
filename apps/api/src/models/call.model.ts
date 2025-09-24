import mongoose, { Document, Schema } from "mongoose";
import { CAMPAIGN_DB_REF } from "./campaign.model";
import { LEAD_DB_REF } from "./lead.model";

export interface ICall extends Document {
  _id: string;
  call_id: string;
  campaign_id: string;
  lead_id: string;
  agent_id: string;
  from: string; // E.164 format phone number
  to: string; // E.164 format phone number
  start_ts?: Date;
  end_ts?: Date;
  duration_seconds: number;
  call_cost: number; // Cost charged to client
  retell_cost: number; // Actual cost from RetellAI
  client_cost: number; // Same as call_cost for consistency
  transcript?: string;
  call_analysis: {
    sentiment?: "positive" | "negative" | "neutral";
    keywords?: string[];
    summary?: string;
    outcome?: "completed" | "voicemail" | "no_answer" | "busy" | "failed" | "hung_up";
    conversion_score?: number; // 0-100
  };
  status: "initiated" | "ringing" | "answered" | "in_progress" | "completed" | "failed" | "no_answer" | "busy" | "voicemail";
  retell_call_id?: string;
  metadata: {
    attempt_number: number;
    user_agent?: string;
    disconnect_reason?: string;
    quality_score?: number; // 1-5
    recording_url?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const callSchema = new Schema<ICall>(
  {
    call_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    campaign_id: {
      type: String,
      required: true,
      ref: CAMPAIGN_DB_REF,
      index: true,
    },
    lead_id: {
      type: String,
      required: true,
      ref: LEAD_DB_REF,
      index: true,
    },
    agent_id: {
      type: String,
      required: [true, "Agent ID is required"],
      index: true,
    },
    from: {
      type: String,
      required: [true, "From phone number is required"],
      match: [/^\+[1-9]\d{1,14}$/, "From number must be in E.164 format"],
    },
    to: {
      type: String,
      required: [true, "To phone number is required"],
      match: [/^\+[1-9]\d{1,14}$/, "To number must be in E.164 format"],
      index: true,
    },
    start_ts: {
      type: Date,
    },
    end_ts: {
      type: Date,
    },
    duration_seconds: {
      type: Number,
      default: 0,
      min: [0, "Duration cannot be negative"],
    },
    call_cost: {
      type: Number,
      default: 0,
      min: [0, "Call cost cannot be negative"],
    },
    retell_cost: {
      type: Number,
      default: 0,
      min: [0, "Retell cost cannot be negative"],
    },
    client_cost: {
      type: Number,
      default: 0,
      min: [0, "Client cost cannot be negative"],
    },
    transcript: {
      type: String,
    },
    call_analysis: {
      sentiment: {
        type: String,
        enum: ["positive", "negative", "neutral"],
      },
      keywords: [{
        type: String,
        trim: true,
      }],
      summary: {
        type: String,
      },
      outcome: {
        type: String,
        enum: ["completed", "voicemail", "no_answer", "busy", "failed", "hung_up"],
      },
      conversion_score: {
        type: Number,
        min: [0, "Conversion score cannot be negative"],
        max: [100, "Conversion score cannot exceed 100"],
      },
    },
    status: {
      type: String,
      enum: ["initiated", "ringing", "answered", "in_progress", "completed", "failed", "no_answer", "busy", "voicemail"],
      default: "initiated",
      index: true,
    },
    retell_call_id: {
      type: String,
      index: true,
    },
    metadata: {
      attempt_number: {
        type: Number,
        required: true,
        min: [1, "Attempt number must be at least 1"],
      },
      user_agent: {
        type: String,
      },
      disconnect_reason: {
        type: String,
      },
      quality_score: {
        type: Number,
        min: [1, "Quality score must be at least 1"],
        max: [5, "Quality score cannot exceed 5"],
      },
      recording_url: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
callSchema.index({ campaign_id: 1, status: 1 });
callSchema.index({ lead_id: 1, "metadata.attempt_number": 1 });
callSchema.index({ start_ts: -1 });
callSchema.index({ end_ts: -1 });
callSchema.index({ status: 1, createdAt: -1 });
callSchema.index({ "call_analysis.outcome": 1 });

// Generate call_id before saving
callSchema.pre("save", async function (next) {
  if (!this.call_id) {
    this.call_id = `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Ensure client_cost matches call_cost
  if (this.call_cost !== this.client_cost) {
    this.client_cost = this.call_cost;
  }

  next();
});

// Method to check if call is completed
callSchema.methods.isCompleted = function(): boolean {
  return ["completed", "failed", "no_answer", "busy", "voicemail"].includes(this.status);
};

// Method to calculate call duration
callSchema.methods.calculateDuration = function(): number {
  if (this.start_ts && this.end_ts) {
    return Math.floor((this.end_ts.getTime() - this.start_ts.getTime()) / 1000);
  }
  return 0;
};

// Method to update call status and timestamps
callSchema.methods.updateStatus = function(newStatus: string, timestamp?: Date): void {
  this.status = newStatus as any;

  if (newStatus === "answered" && !this.start_ts) {
    this.start_ts = timestamp || new Date();
  }

  if (this.isCompleted() && !this.end_ts) {
    this.end_ts = timestamp || new Date();
    this.duration_seconds = this.calculateDuration();
  }
};

// Method to calculate profit margin
callSchema.methods.getProfitMargin = function(): number {
  if (this.retell_cost === 0) return 0;
  return ((this.call_cost - this.retell_cost) / this.call_cost) * 100;
};

// Static method to get calls by outcome
callSchema.statics.getByOutcome = function(outcome: string, campaignId?: string) {
  const query: any = { "call_analysis.outcome": outcome };
  if (campaignId) query.campaign_id = campaignId;
  return this.find(query);
};

export const CALL_DB_REF = "Call";
const Call = mongoose.model<ICall>(CALL_DB_REF, callSchema);

export default Call;