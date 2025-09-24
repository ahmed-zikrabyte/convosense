import mongoose, { Document, Schema } from "mongoose";
import { CLIENT_DB_REF } from "./client.model";
import { CAMPAIGN_DB_REF } from "./campaign.model";
import { CALL_DB_REF } from "./call.model";

export interface ITransaction extends Document {
  _id: string;
  tx_id: string;
  client_id: string;
  campaign_id?: string;
  call_id?: string;
  type: "purchase" | "reserve" | "consume" | "refund" | "adjustment";
  minutes: number;
  amount_usd: number;
  reference_id?: string; // External payment reference
  status: "pending" | "completed" | "failed" | "cancelled" | "reversed";
  metadata: {
    description?: string;
    payment_method?: string;
    external_transaction_id?: string;
    admin_user_id?: string; // For manual adjustments
    batch_id?: string; // For batch operations
    reason?: string; // For refunds/adjustments
  };
  balance_before: number;
  balance_after: number;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    tx_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    client_id: {
      type: String,
      required: true,
      ref: CLIENT_DB_REF,
      index: true,
    },
    campaign_id: {
      type: String,
      ref: CAMPAIGN_DB_REF,
      index: true,
    },
    call_id: {
      type: String,
      ref: CALL_DB_REF,
      index: true,
    },
    type: {
      type: String,
      enum: ["purchase", "reserve", "consume", "refund", "adjustment"],
      required: [true, "Transaction type is required"],
      index: true,
    },
    minutes: {
      type: Number,
      required: [true, "Minutes amount is required"],
    },
    amount_usd: {
      type: Number,
      required: [true, "USD amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    reference_id: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled", "reversed"],
      default: "pending",
      index: true,
    },
    metadata: {
      description: {
        type: String,
        trim: true,
      },
      payment_method: {
        type: String,
        enum: ["credit_card", "bank_transfer", "paypal", "stripe", "manual", "system"],
      },
      external_transaction_id: {
        type: String,
        trim: true,
      },
      admin_user_id: {
        type: String,
      },
      batch_id: {
        type: String,
      },
      reason: {
        type: String,
        trim: true,
      },
    },
    balance_before: {
      type: Number,
      required: [true, "Balance before is required"],
      min: [0, "Balance before cannot be negative"],
    },
    balance_after: {
      type: Number,
      required: [true, "Balance after is required"],
      min: [0, "Balance after cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
transactionSchema.index({ client_id: 1, type: 1 });
transactionSchema.index({ client_id: 1, status: 1 });
transactionSchema.index({ campaign_id: 1, type: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ reference_id: 1, status: 1 });

// Generate tx_id before saving
transactionSchema.pre("save", async function (next) {
  if (!this.tx_id) {
    this.tx_id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  next();
});

// Method to check if transaction is reversible
transactionSchema.methods.isReversible = function(): boolean {
  return this.status === "completed" &&
         ["purchase", "refund", "adjustment"].includes(this.type) &&
         this.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Within 30 days
};

// Method to reverse transaction
transactionSchema.methods.reverse = function(adminUserId: string, reason: string): ITransaction {
  const reverseAmount = this.type === "purchase" ? -this.minutes : this.minutes;
  const reverseUsdAmount = this.type === "purchase" ? -this.amount_usd : this.amount_usd;

  return {
    client_id: this.client_id,
    campaign_id: this.campaign_id,
    type: "adjustment" as const,
    minutes: reverseAmount,
    amount_usd: reverseUsdAmount,
    reference_id: this.tx_id,
    status: "completed" as const,
    metadata: {
      description: `Reversal of transaction ${this.tx_id}`,
      admin_user_id: adminUserId,
      reason: reason,
    },
    balance_before: 0, // Will be set by the service
    balance_after: 0,  // Will be set by the service
  } as ITransaction;
};

// Method to check if transaction affects balance
transactionSchema.methods.affectsBalance = function(): boolean {
  return this.status === "completed" && this.type !== "reserve";
};

// Static method to get client transaction summary
transactionSchema.statics.getClientSummary = async function(clientId: string, startDate?: Date, endDate?: Date) {
  const match: any = {
    client_id: clientId,
    status: "completed"
  };

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = startDate;
    if (endDate) match.createdAt.$lte = endDate;
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$type",
        total_minutes: { $sum: "$minutes" },
        total_amount_usd: { $sum: "$amount_usd" },
        transaction_count: { $sum: 1 },
      }
    },
  ]);
};

// Static method to get spending by campaign
transactionSchema.statics.getSpendingByCampaign = async function(clientId: string, startDate?: Date, endDate?: Date) {
  const match: any = {
    client_id: clientId,
    status: "completed",
    type: "consume",
    campaign_id: { $exists: true }
  };

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = startDate;
    if (endDate) match.createdAt.$lte = endDate;
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$campaign_id",
        total_minutes: { $sum: "$minutes" },
        total_amount_usd: { $sum: "$amount_usd" },
        call_count: { $sum: 1 },
      }
    },
    {
      $lookup: {
        from: "campaigns",
        localField: "_id",
        foreignField: "campaignId",
        as: "campaign"
      }
    },
    { $unwind: "$campaign" },
    {
      $project: {
        campaign_id: "$_id",
        campaign_name: "$campaign.name",
        total_minutes: 1,
        total_amount_usd: 1,
        call_count: 1,
      }
    },
  ]);
};

export const TRANSACTION_DB_REF = "Transaction";
const Transaction = mongoose.model<ITransaction>(TRANSACTION_DB_REF, transactionSchema);

export default Transaction;