import jwt, { SignOptions } from "jsonwebtoken";
import Admin, { IAdmin } from "../../../../models/admin.model";
import config from "../../../../config";
import AppError from "../../../../utils/AppError";

const signAdminToken = (id: string, role: string) => {
  const secret = config.adminJwt.secret;
  const expiresIn = config.adminJwt.expiresIn;

  const options: SignOptions = {
    expiresIn: expiresIn as any,
  };

  return jwt.sign({ id, type: "admin", role }, secret as string, options);
};

export const registerAdmin = async (adminData: Partial<IAdmin>) => {
  const { name, email, password, role, permissions } = adminData;

  if (!name || !email || !password) {
    throw new AppError("Please provide name, email and password", 400);
  }

  // Check if admin already exists
  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    throw new AppError("Admin with this email already exists", 400);
  }

  // Set default permissions based on role
  let defaultPermissions: string[] = [];
  if (role === "super_admin") {
    defaultPermissions = [
      "read_users",
      "write_users",
      "delete_users",
      "read_clients",
      "write_clients",
      "delete_clients",
      "system_settings"
    ];
  } else {
    defaultPermissions = ["read_users", "read_clients"];
  }

  // Create new admin
  const newAdmin = await Admin.create({
    name,
    email,
    password,
    role: role || "admin",
    permissions: permissions || defaultPermissions,
  });

  const token = signAdminToken(newAdmin._id, newAdmin.role);

  return { admin: newAdmin.toJSON(), token };
};

export const loginAdmin = async (credentials: { email: string; password: string }) => {
  const { email, password } = credentials;

  if (!email || !password) {
    throw new AppError("Please provide email and password", 400);
  }

  // Find admin and include password for comparison
  const admin = await Admin.findOne({ email, isActive: true }).select("+password");

  if (!admin || !(await admin.comparePassword(password))) {
    throw new AppError("Incorrect email or password", 401);
  }

  // Update last login
  admin.lastLogin = new Date();
  await admin.save();

  const token = signAdminToken(admin._id, admin.role);

  return { admin: admin.toJSON(), token };
};