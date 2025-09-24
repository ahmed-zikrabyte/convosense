import mongoose, { Document, Schema } from "mongoose";
import { CLIENT_DB_REF } from "./client.model";

export interface IPhoneNumber extends Document {
  _id: string;
  phone_number: string; // E.164 format
  provider: "retell" | "twilio" | "manual";
  assigned_client_id?: string;
  type: "local" | "toll_free" | "international";
  imported: boolean;
  is_active: boolean;
  metadata: {
    country_code?: string;
    region?: string;
    capabilities?: string[];
    monthly_cost?: number;
    setup_cost?: number;
  };
  assigned_at?: Date;
  purchased_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

const phoneNumberSchema = new Schema<IPhoneNumber>(
  {
    phone_number: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [/^\+[1-9]\d{1,14}$/, "Phone number must be in E.164 format"],
      index: true,
    },
    provider: {
      type: String,
      enum: ["retell", "twilio", "manual"],
      required: [true, "Provider is required"],
      index: true,
    },
    assigned_client_id: {
      type: String,
      ref: CLIENT_DB_REF,
      index: true,
    },
    type: {
      type: String,
      enum: ["local", "toll_free", "international"],
      required: [true, "Phone number type is required"],
      index: true,
    },
    imported: {
      type: Boolean,
      default: false,
      index: true,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    metadata: {
      country_code: {
        type: String,
        uppercase: true,
        length: [2, "Country code must be 2 characters"],
      },
      region: {
        type: String,
        trim: true,
      },
      capabilities: [{
        type: String,
        enum: ["voice", "sms", "mms", "fax"],
      }],
      monthly_cost: {
        type: Number,
        min: [0, "Monthly cost cannot be negative"],
      },
      setup_cost: {
        type: Number,
        min: [0, "Setup cost cannot be negative"],
      },
    },
    assigned_at: {
      type: Date,
    },
    purchased_at: {
      type: Date,
      required: [true, "Purchase date is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
phoneNumberSchema.index({ provider: 1, is_active: 1 });
phoneNumberSchema.index({ assigned_client_id: 1, is_active: 1 });
phoneNumberSchema.index({ type: 1, is_active: 1 });
phoneNumberSchema.index({ purchased_at: -1 });

// Method to check if phone number is available for assignment
phoneNumberSchema.methods.isAvailable = function(): boolean {
  return this.is_active && !this.assigned_client_id;
};

// Method to assign phone number to client
phoneNumberSchema.methods.assignToClient = function(clientId: string): void {
  this.assigned_client_id = clientId;
  this.assigned_at = new Date();
};

// Method to unassign phone number from client
phoneNumberSchema.methods.unassign = function(): void {
  this.assigned_client_id = undefined;
  this.assigned_at = undefined;
};

// Static method to get available phone numbers by type
phoneNumberSchema.statics.getAvailableByType = function(type: string) {
  return this.find({
    type: type,
    is_active: true,
    assigned_client_id: { $exists: false }
  });
};

export const PHONE_NUMBER_DB_REF = "PhoneNumber";
const PhoneNumber = mongoose.model<IPhoneNumber>(PHONE_NUMBER_DB_REF, phoneNumberSchema);

export default PhoneNumber;