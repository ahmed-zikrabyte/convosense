import mongoose, { Document, Schema } from "mongoose";
import { CLIENT_DB_REF } from "./client.model";
import { CAMPAIGN_DB_REF } from "./campaign.model";

export interface ICampaignContact extends Document {
  _id: string;
  campaign_id: string;
  client_id: string;
  phone_number: string; // E.164 format
  dynamic_variables: Record<string, string>; // Flexible key-value pairs for dynamic variables
  is_active: boolean;
  call_status?: "pending" | "completed" | "failed" | "in_progress";
  call_attempts: number;
  last_call_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const campaignContactSchema = new Schema<ICampaignContact>(
  {
    campaign_id: {
      type: String,
      required: [true, "Campaign ID is required"],
      ref: CAMPAIGN_DB_REF,
      index: true,
    },
    client_id: {
      type: String,
      required: [true, "Client ID is required"],
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
    dynamic_variables: {
      type: Schema.Types.Mixed,
      default: {},
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    call_status: {
      type: String,
      enum: ["pending", "completed", "failed", "in_progress"],
      default: "pending",
      index: true,
    },
    call_attempts: {
      type: Number,
      default: 0,
      min: [0, "Call attempts cannot be negative"],
    },
    last_call_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
campaignContactSchema.index({ campaign_id: 1, is_active: 1 });
campaignContactSchema.index({ campaign_id: 1, call_status: 1 });
campaignContactSchema.index({ client_id: 1, is_active: 1 });
campaignContactSchema.index({ phone_number: 1, campaign_id: 1 }, { unique: true }); // Prevent duplicate phone numbers per campaign
campaignContactSchema.index({ createdAt: -1 });

// Method to update call status
campaignContactSchema.methods.updateCallStatus = function(status: string, incrementAttempts: boolean = true): void {
  this.call_status = status;
  if (incrementAttempts) {
    this.call_attempts += 1;
  }
  this.last_call_at = new Date();
};

// Static method to get contacts by campaign
campaignContactSchema.statics.getByCampaign = function(campaignId: string, includeInactive: boolean = false) {
  const query: any = { campaign_id: campaignId };
  if (!includeInactive) {
    query.is_active = true;
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to get pending contacts for calling
campaignContactSchema.statics.getPendingContacts = function(campaignId: string, limit?: number) {
  const query = this.find({
    campaign_id: campaignId,
    is_active: true,
    call_status: "pending"
  }).sort({ createdAt: 1 });

  if (limit) {
    query.limit(limit);
  }

  return query;
};

export const CAMPAIGN_CONTACT_DB_REF = "CampaignContact";
const CampaignContact = mongoose.model<ICampaignContact>(CAMPAIGN_CONTACT_DB_REF, campaignContactSchema);

export default CampaignContact;