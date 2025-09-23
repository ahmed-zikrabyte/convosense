import jwt, {SignOptions} from "jsonwebtoken";
import User, { IUser } from "../../../../models/user.model";
import config from "../../../../config";
import AppError from "../../../../utils/AppError";

const signToken = (id: string, role: "admin" | "client") => {
  const secret = role === "admin" ? config.adminJwt.secret : config.jwt.secret;
  const expiresIn =
    role === "admin" ? config.adminJwt.expiresIn : config.jwt.expiresIn;

  const options: SignOptions = {
    expiresIn: expiresIn as any,
  };

  return jwt.sign({id, role}, secret as string, options);
};

export const registerUser = async (userData: Partial<IUser>) => {
  const {name, email, password, role} = userData;

  if (!name || !email || !password || !role) {
    throw new AppError("Please provide all required fields", 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("User with this email already exists", 400);
  }

  // Create new user (password will be hashed by pre-save middleware)
  const newUser = await User.create({
    name,
    email,
    password,
    role,
  });

  const token = signToken(newUser._id, newUser.role);

  return {user: newUser.toJSON(), token};
};

export const loginUser = async (credentials: Partial<IUser>) => {
  const {email, password} = credentials;

  if (!email || !password) {
    throw new AppError("Please provide email and password", 400);
  }

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Incorrect email or password", 401);
  }

  const token = signToken(user._id, user.role);

  return {user: user.toJSON(), token};
};
