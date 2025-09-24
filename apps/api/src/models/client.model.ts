import mongoose, {Document, Schema} from "mongoose";
import bcrypt from "bcryptjs";

export interface IClient extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  credits_total_minutes: number;
  credits_reserved_minutes: number;
  credits_consumed_minutes: number;
  billing_rate: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  reserveCredits(minutes: number): Promise<boolean>;
  consumeCredits(minutes: number): Promise<boolean>;
  refundCredits(minutes: number): Promise<boolean>;
  getAvailableCredits(): number;
}

const clientSchema = new Schema<IClient>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot be more than 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    credits_total_minutes: {
      type: Number,
      default: 0,
      min: [0, "Total minutes cannot be negative"],
    },
    credits_reserved_minutes: {
      type: Number,
      default: 0,
      min: [0, "Reserved minutes cannot be negative"],
    },
    credits_consumed_minutes: {
      type: Number,
      default: 0,
      min: [0, "Consumed minutes cannot be negative"],
    },
    billing_rate: {
      type: Number,
      default: 0.10,
      min: [0, "Billing rate cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
clientSchema.index({email: 1});
clientSchema.index({isActive: 1});

// Hash password before saving
clientSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
clientSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Credit tracking methods
clientSchema.methods.reserveCredits = async function (minutes: number): Promise<boolean> {
  if (this.getAvailableCredits() < minutes) {
    return false;
  }

  this.credits_reserved_minutes += minutes;
  await this.save();
  return true;
};

clientSchema.methods.consumeCredits = async function (minutes: number): Promise<boolean> {
  if (this.credits_reserved_minutes < minutes) {
    return false;
  }

  this.credits_reserved_minutes -= minutes;
  this.credits_consumed_minutes += minutes;
  await this.save();
  return true;
};

clientSchema.methods.refundCredits = async function (minutes: number): Promise<boolean> {
  if (this.credits_reserved_minutes < minutes) {
    return false;
  }

  this.credits_reserved_minutes -= minutes;
  await this.save();
  return true;
};

clientSchema.methods.getAvailableCredits = function (): number {
  return this.credits_total_minutes - this.credits_reserved_minutes - this.credits_consumed_minutes;
};

// Remove password from JSON output
clientSchema.methods.toJSON = function () {
  const clientObject = this.toObject();
  delete clientObject.password;
  return clientObject;
};

export const CLIENT_DB_REF = "Client";
const Client = mongoose.model<IClient>(CLIENT_DB_REF, clientSchema);

export default Client;
