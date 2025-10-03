import mongoose, { Document, Schema } from "mongoose";
import { CLIENT_DB_REF } from "./client.model";

export interface ICampaign extends Document {
  _id: string;
  campaignId: string;
  clientId: string;
  name: string;
  status: "draft" | "published"; // Simplified status - our internal system status
  agent_id: string; // Required since campaigns are agent-based
  published_version: number;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    campaignId: {
      type: String,
      unique: true,
      index: true,
    },
    clientId: {
      type: String,
      required: true,
      ref: CLIENT_DB_REF,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Campaign name is required"],
      trim: true,
      maxlength: [200, "Campaign name cannot be more than 200 characters"],
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    agent_id: {
      type: String,
      required: [true, "Agent ID is required"],
      index: true,
    },
    published_version: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
campaignSchema.index({ clientId: 1, status: 1 });
campaignSchema.index({ createdAt: -1 });

// Generate campaignId before saving
campaignSchema.pre("save", async function (next) {
  if (!this.campaignId) {
    this.campaignId = `camp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  next();
});

export const CAMPAIGN_DB_REF = "Campaign";
const Campaign = mongoose.model<ICampaign>(CAMPAIGN_DB_REF, campaignSchema);

export default Campaign;