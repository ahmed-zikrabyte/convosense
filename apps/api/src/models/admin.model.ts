import mongoose, {Document, Schema} from "mongoose";
import bcrypt from "bcryptjs";

export interface IAdmin extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: "super_admin" | "admin";
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const adminSchema = new Schema<IAdmin>(
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
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["super_admin", "admin"],
      default: "admin",
      required: [true, "Role is required"],
    },
    permissions: [
      {
        type: String,
        enum: [
          "read_users",
          "write_users",
          "delete_users",
          "read_clients",
          "write_clients",
          "delete_clients",
          "system_settings",
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
adminSchema.index({email: 1});
adminSchema.index({role: 1});
adminSchema.index({isActive: 1});

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
adminSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
adminSchema.methods.toJSON = function () {
  const adminObject = this.toObject();
  delete adminObject.password;
  return adminObject;
};

export const ADMIN_DB_REF = "Admin";
const Admin = mongoose.model<IAdmin>(ADMIN_DB_REF, adminSchema);

export default Admin;
