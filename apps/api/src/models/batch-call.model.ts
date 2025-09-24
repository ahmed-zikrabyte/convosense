import mongoose, { Document, Schema } from "mongoose";
import { CLIENT_DB_REF } from "./client.model";
import { CAMPAIGN_DB_REF } from "./campaign.model";

export interface IBatchCall extends Document {
  _id: string;
  batch_id: string;
  campaign_id: string;
  client_id: string;
  tasks_count: number;
  scheduled_ts?: Date;
  status: "pending" | "scheduled" | "processing" | "completed" | "failed" | "cancelled";
  metadata: {
    estimated_duration_minutes: number;
    estimated_cost: number;
    reserved_credits: number;
    phone_number_used?: string;
    retry_failed_calls: boolean;
  };
  execution_details: {
    started_at?: Date;
    completed_at?: Date;
    successful_calls: number;
    failed_calls: number;
    total_duration_seconds: number;
    total_cost: number;
    error_message?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const batchCallSchema = new Schema<IBatchCall>(
  {
    batch_id: {
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
    client_id: {
      type: String,
      required: true,
      ref: CLIENT_DB_REF,
      index: true,
    },
    tasks_count: {
      type: Number,
      required: [true, "Tasks count is required"],
      min: [1, "Tasks count must be at least 1"],
    },
    scheduled_ts: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "scheduled", "processing", "completed", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    metadata: {
      estimated_duration_minutes: {
        type: Number,
        required: true,
        min: [0, "Estimated duration cannot be negative"],
      },
      estimated_cost: {
        type: Number,
        required: true,
        min: [0, "Estimated cost cannot be negative"],
      },
      reserved_credits: {
        type: Number,
        required: true,
        min: [0, "Reserved credits cannot be negative"],
      },
      phone_number_used: {
        type: String,
        match: [/^\+[1-9]\d{1,14}$/, "Phone number must be in E.164 format"],
      },
      retry_failed_calls: {
        type: Boolean,
        default: true,
      },
    },
    execution_details: {
      started_at: {
        type: Date,
      },
      completed_at: {
        type: Date,
      },
      successful_calls: {
        type: Number,
        default: 0,
        min: [0, "Successful calls cannot be negative"],
      },
      failed_calls: {
        type: Number,
        default: 0,
        min: [0, "Failed calls cannot be negative"],
      },
      total_duration_seconds: {
        type: Number,
        default: 0,
        min: [0, "Total duration cannot be negative"],
      },
      total_cost: {
        type: Number,
        default: 0,
        min: [0, "Total cost cannot be negative"],
      },
      error_message: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
batchCallSchema.index({ campaign_id: 1, status: 1 });
batchCallSchema.index({ client_id: 1, status: 1 });
batchCallSchema.index({ scheduled_ts: 1, status: 1 });
batchCallSchema.index({ createdAt: -1 });
batchCallSchema.index({ "execution_details.completed_at": -1 });

// Generate batch_id before saving
batchCallSchema.pre("save", async function (next) {
  if (!this.batch_id) {
    this.batch_id = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  next();
});

// Method to check if batch is scheduled
batchCallSchema.methods.isScheduled = function(): boolean {
  return this.status === "scheduled" && this.scheduled_ts && this.scheduled_ts > new Date();
};

// Method to check if batch is ready to execute
batchCallSchema.methods.isReadyToExecute = function(): boolean {
  if (this.status !== "scheduled") return false;
  if (!this.scheduled_ts) return this.status === "pending";
  return this.scheduled_ts <= new Date();
};

// Method to start batch execution
batchCallSchema.methods.startExecution = function(): void {
  this.status = "processing";
  this.execution_details.started_at = new Date();
};

// Method to complete batch execution
batchCallSchema.methods.completeExecution = function(successfulCalls: number, failedCalls: number, totalDuration: number, totalCost: number): void {
  this.status = "completed";
  this.execution_details.completed_at = new Date();
  this.execution_details.successful_calls = successfulCalls;
  this.execution_details.failed_calls = failedCalls;
  this.execution_details.total_duration_seconds = totalDuration;
  this.execution_details.total_cost = totalCost;
};

// Method to fail batch execution
batchCallSchema.methods.failExecution = function(errorMessage: string): void {
  this.status = "failed";
  this.execution_details.completed_at = new Date();
  this.execution_details.error_message = errorMessage;
};

export const BATCH_CALL_DB_REF = "BatchCall";
const BatchCall = mongoose.model<IBatchCall>(BATCH_CALL_DB_REF, batchCallSchema);

export default BatchCall;