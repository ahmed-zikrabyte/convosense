import mongoose, { Document, Schema } from "mongoose";

export interface IWebhookEvent extends Document {
  _id: string;
  event_id: string;
  event_type: string;
  payload: Record<string, any>;
  processed: boolean;
  processing_attempts: number;
  last_attempt_at?: Date;
  error_message?: string;
  source: "retell" | "twilio" | "stripe" | "other";
  metadata: {
    signature?: string;
    user_agent?: string;
    ip_address?: string;
    headers?: Record<string, string>;
  };
  related_entities: {
    call_id?: string;
    campaign_id?: string;
    client_id?: string;
    lead_id?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    event_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    event_type: {
      type: String,
      required: [true, "Event type is required"],
      trim: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: [true, "Payload is required"],
    },
    processed: {
      type: Boolean,
      default: false,
      index: true,
    },
    processing_attempts: {
      type: Number,
      default: 0,
      min: [0, "Processing attempts cannot be negative"],
    },
    last_attempt_at: {
      type: Date,
    },
    error_message: {
      type: String,
    },
    source: {
      type: String,
      enum: ["retell", "twilio", "stripe", "other"],
      required: [true, "Source is required"],
      index: true,
    },
    metadata: {
      signature: {
        type: String,
      },
      user_agent: {
        type: String,
      },
      ip_address: {
        type: String,
        match: [/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/, "Invalid IP address format"],
      },
      headers: {
        type: Schema.Types.Mixed,
      },
    },
    related_entities: {
      call_id: {
        type: String,
        index: true,
      },
      campaign_id: {
        type: String,
        index: true,
      },
      client_id: {
        type: String,
        index: true,
      },
      lead_id: {
        type: String,
        index: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
webhookEventSchema.index({ source: 1, event_type: 1 });
webhookEventSchema.index({ processed: 1, processing_attempts: 1 });
webhookEventSchema.index({ processed: 1, createdAt: -1 });
webhookEventSchema.index({ "related_entities.call_id": 1, event_type: 1 });
webhookEventSchema.index({ "related_entities.campaign_id": 1, event_type: 1 });
webhookEventSchema.index({ createdAt: -1 });

// Generate event_id before saving
webhookEventSchema.pre("save", async function (next) {
  if (!this.event_id) {
    this.event_id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  next();
});

// Method to check if event should be retried
webhookEventSchema.methods.shouldRetry = function(maxAttempts: number = 3): boolean {
  return !this.processed &&
         this.processing_attempts < maxAttempts &&
         (!this.last_attempt_at ||
          this.last_attempt_at < new Date(Date.now() - 5 * 60 * 1000)); // 5 minutes ago
};

// Method to mark processing attempt
webhookEventSchema.methods.markAttempt = function(success: boolean, errorMessage?: string): void {
  this.processing_attempts += 1;
  this.last_attempt_at = new Date();

  if (success) {
    this.processed = true;
    this.error_message = undefined;
  } else {
    this.error_message = errorMessage;
  }
};

// Method to reset processing state (for manual retry)
webhookEventSchema.methods.resetProcessing = function(): void {
  this.processed = false;
  this.processing_attempts = 0;
  this.last_attempt_at = undefined;
  this.error_message = undefined;
};

// Method to extract related entity IDs from payload
webhookEventSchema.methods.extractRelatedEntities = function(): void {
  const payload = this.payload;

  // Common patterns for extracting IDs from different webhook sources
  if (this.source === "retell") {
    this.related_entities.call_id = payload.call?.call_id || payload.call_id;
    // Add more extraction logic based on RetellAI webhook structure
  }

  // Additional extraction logic for other sources can be added here
};

// Static method to get unprocessed events
webhookEventSchema.statics.getUnprocessed = function(source?: string, eventType?: string) {
  const query: any = { processed: false };
  if (source) query.source = source;
  if (eventType) query.event_type = eventType;

  return this.find(query)
    .sort({ createdAt: 1 })
    .limit(100);
};

// Static method to get events for retry
webhookEventSchema.statics.getForRetry = function(maxAttempts: number = 3) {
  return this.find({
    processed: false,
    processing_attempts: { $lt: maxAttempts },
    $or: [
      { last_attempt_at: { $exists: false } },
      { last_attempt_at: { $lt: new Date(Date.now() - 5 * 60 * 1000) } }
    ]
  })
  .sort({ createdAt: 1 })
  .limit(50);
};

// Static method to get processing statistics
webhookEventSchema.statics.getProcessingStats = async function(startDate?: Date, endDate?: Date) {
  const match: any = {};

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = startDate;
    if (endDate) match.createdAt.$lte = endDate;
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          source: "$source",
          event_type: "$event_type",
          processed: "$processed"
        },
        count: { $sum: 1 },
        avg_attempts: { $avg: "$processing_attempts" }
      }
    },
    {
      $group: {
        _id: {
          source: "$_id.source",
          event_type: "$_id.event_type"
        },
        total_events: { $sum: "$count" },
        processed_events: {
          $sum: {
            $cond: [{ $eq: ["$_id.processed", true] }, "$count", 0]
          }
        },
        failed_events: {
          $sum: {
            $cond: [{ $eq: ["$_id.processed", false] }, "$count", 0]
          }
        },
        avg_processing_attempts: { $avg: "$avg_attempts" }
      }
    }
  ]);
};

export const WEBHOOK_EVENT_DB_REF = "WebhookEvent";
const WebhookEvent = mongoose.model<IWebhookEvent>(WEBHOOK_EVENT_DB_REF, webhookEventSchema);

export default WebhookEvent;