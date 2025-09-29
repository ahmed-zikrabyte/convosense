import mongoose, { Document, Schema } from "mongoose";
import { CLIENT_DB_REF } from "./client.model";

export interface IAgent extends Document {
  _id: string;
  agentId: string;
  agentName: string;
  slug: string;
  assignedClientId?: string;
  assignedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isAvailable(): boolean;
  assignToClient(clientId: string): void;
  unassign(): void;
}

const agentSchema = new Schema<IAgent>(
  {
    agentId: {
      type: String,
      required: [true, "Agent ID is required"],
      unique: true,
      index: true,
    },
    agentName: {
      type: String,
      required: [true, "Agent name is required"],
      trim: true,
      maxlength: [200, "Agent name cannot be more than 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    assignedClientId: {
      type: String,
      ref: CLIENT_DB_REF,
      index: true,
    },
    assignedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

agentSchema.index({ createdAt: -1 });
agentSchema.index({ assignedClientId: 1, assignedAt: -1 });

agentSchema.pre("save", async function (next) {
  if (!this.slug) {
    const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const nameSlug = this.agentName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    this.slug = `${nameSlug}-${randomId}`;
  }
  next();
});

agentSchema.methods.isAvailable = function(): boolean {
  return !this.assignedClientId;
};

agentSchema.methods.assignToClient = function(clientId: string): void {
  this.assignedClientId = clientId;
  this.assignedAt = new Date();
};

agentSchema.methods.unassign = function(): void {
  this.assignedClientId = undefined;
  this.assignedAt = undefined;
};

export const AGENT_DB_REF = "Agent";
const Agent = mongoose.model<IAgent>(AGENT_DB_REF, agentSchema);

export default Agent;