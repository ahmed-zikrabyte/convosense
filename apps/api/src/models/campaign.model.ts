import mongoose, { Document, Schema } from "mongoose";
import { CLIENT_DB_REF } from "./client.model";

export interface ICampaign extends Document {
  _id: string;
  campaignId: string;
  clientId: string;
  name: string;
  script_raw: string;
  kb_files_meta: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedAt: Date;
    fileUrl?: string;
  }>;
  voice_id: string;
  settings: {
    max_duration_seconds: number;
    retry_attempts: number;
    retry_delay_seconds: number;
    enable_voicemail_detection: boolean;
    enable_ambient_sounds: boolean;
    ambient_sound_volume: number;
    webhook_url?: string;
  };
  status: "draft" | "active" | "paused" | "completed" | "archived";
  agent_id?: string;
  knowledge_base_id?: string;
  published_version?: number;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    campaignId: {
      type: String,
      required: true,
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
    script_raw: {
      type: String,
      required: [true, "Campaign script is required"],
    },
    kb_files_meta: [{
      fileName: {
        type: String,
        required: true,
      },
      fileType: {
        type: String,
        required: true,
      },
      fileSize: {
        type: Number,
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
      fileUrl: {
        type: String,
      },
    }],
    voice_id: {
      type: String,
      required: [true, "Voice ID is required"],
    },
    settings: {
      max_duration_seconds: {
        type: Number,
        default: 300, // 5 minutes
        min: [30, "Call duration must be at least 30 seconds"],
        max: [1800, "Call duration cannot exceed 30 minutes"],
      },
      retry_attempts: {
        type: Number,
        default: 3,
        min: [0, "Retry attempts cannot be negative"],
        max: [10, "Retry attempts cannot exceed 10"],
      },
      retry_delay_seconds: {
        type: Number,
        default: 3600, // 1 hour
        min: [300, "Retry delay must be at least 5 minutes"],
      },
      enable_voicemail_detection: {
        type: Boolean,
        default: true,
      },
      enable_ambient_sounds: {
        type: Boolean,
        default: false,
      },
      ambient_sound_volume: {
        type: Number,
        default: 0.1,
        min: [0, "Volume cannot be negative"],
        max: [1, "Volume cannot exceed 1.0"],
      },
      webhook_url: {
        type: String,
      },
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "completed", "archived"],
      default: "draft",
      index: true,
    },
    agent_id: {
      type: String,
      index: true,
    },
    knowledge_base_id: {
      type: String,
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