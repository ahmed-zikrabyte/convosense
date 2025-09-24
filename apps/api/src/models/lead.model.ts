import mongoose, { Document, Schema } from "mongoose";
import { CLIENT_DB_REF } from "./client.model";
import { CAMPAIGN_DB_REF } from "./campaign.model";

export interface ILead extends Document {
  _id: string;
  leadId: string;
  campaignId: string;
  clientId: string;
  phone_number: string; // E.164 format
  dynamic_vars: Record<string, any>;
  status: "pending" | "calling" | "completed" | "failed" | "no_answer" | "busy" | "voicemail" | "do_not_call";
  last_attempted_at?: Date;
  last_call_id?: string;
  attempts_count: number;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    leadId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    campaignId: {
      type: String,
      required: true,
      ref: CAMPAIGN_DB_REF,
      index: true,
    },
    clientId: {
      type: String,
      required: true,
      ref: CLIENT_DB_REF,
      index: true,
    },
    phone_number: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^\+[1-9]\d{1,14}$/, "Phone number must be in E.164 format"],
      index: true,
    },
    dynamic_vars: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["pending", "calling", "completed", "failed", "no_answer", "busy", "voicemail", "do_not_call"],
      default: "pending",
      index: true,
    },
    last_attempted_at: {
      type: Date,
    },
    last_call_id: {
      type: String,
    },
    attempts_count: {
      type: Number,
      default: 0,
      min: [0, "Attempts count cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
leadSchema.index({ campaignId: 1, status: 1 });
leadSchema.index({ clientId: 1, status: 1 });
leadSchema.index({ phone_number: 1, campaignId: 1 }, { unique: true });
leadSchema.index({ last_attempted_at: -1 });
leadSchema.index({ createdAt: -1 });

// Generate leadId before saving
leadSchema.pre("save", async function (next) {
  if (!this.leadId) {
    this.leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  next();
});

// Method to check if lead can be retried
leadSchema.methods.canRetry = function(maxRetries: number = 3): boolean {
  return this.attempts_count < maxRetries &&
         this.status !== "completed" &&
         this.status !== "do_not_call";
};

// Method to increment attempt count
leadSchema.methods.incrementAttempts = function(): void {
  this.attempts_count += 1;
  this.last_attempted_at = new Date();
};

export const LEAD_DB_REF = "Lead";
const Lead = mongoose.model<ILead>(LEAD_DB_REF, leadSchema);

export default Lead;