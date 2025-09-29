import mongoose, { Document, Schema } from "mongoose";

export interface IAgent extends Document {
  _id: string;
  agentId: string;
  agentName: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
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
  },
  {
    timestamps: true,
  }
);

agentSchema.index({ createdAt: -1 });

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

export const AGENT_DB_REF = "Agent";
const Agent = mongoose.model<IAgent>(AGENT_DB_REF, agentSchema);

export default Agent;