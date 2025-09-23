import jwt, {SignOptions} from "jsonwebtoken";
import Client, {IClient} from "../../../../models/client.model";
import config from "../../../../config";
import AppError from "../../../../utils/AppError";

const signClientToken = (id: string) => {
  const secret = config.jwt.secret;
  const expiresIn = config.jwt.expiresIn;

  const options: SignOptions = {
    expiresIn: expiresIn as any,
  };

  return jwt.sign({id, type: "client"}, secret as string, options);
};

export const registerClient = async (clientData: Partial<IClient>) => {
  const {name, email, password, phone, address} = clientData;

  if (!name || !email || !password) {
    throw new AppError("Please provide name, email and password", 400);
  }

  // Check if client already exists
  const existingClient = await Client.findOne({email});
  if (existingClient) {
    throw new AppError("Client with this email already exists", 400);
  }

  // Create new client
  const newClient = await Client.create({
    name,
    email,
    password,
    phone,
    address,
  });

  const token = signClientToken(newClient._id);

  return {client: newClient.toJSON(), token};
};

export const loginClient = async (credentials: {
  email: string;
  password: string;
}) => {
  const {email, password} = credentials;

  if (!email || !password) {
    throw new AppError("Please provide email and password", 400);
  }

  // Find client and include password for comparison
  console.log("Searching for email:", email);

  // Debug: Try finding by email only first
  const clientByEmail = await Client.findOne({email});
  console.log("Client by email only:", clientByEmail);

  // Debug: Check isActive field specifically
  const clientWithActive = await Client.findOne({email, isActive: true});
  console.log("Client with isActive true:", clientWithActive);

  const client = await Client.findOne({email}).select("+password");
  console.log({client, password, email});

  if (!client || !(await client.comparePassword(password))) {
    throw new AppError("Incorrect email or password", 401);
  }

  const token = signClientToken(client._id);

  return {client: client.toJSON(), token};
};
