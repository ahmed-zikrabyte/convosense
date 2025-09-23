import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/user.model";
import config from "../config";

dotenv.config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoURI);
    console.log("Connected to MongoDB");

    // Clear existing users
    await User.deleteMany({});
    console.log("Cleared existing users");

    // Create test users
    const testUsers = [
      {
        name: "Test Client",
        email: "client@test.com",
        password: "password123",
        role: "client" as const,
      },
      {
        name: "Test Admin",
        email: "admin@test.com",
        password: "password123",
        role: "admin" as const,
      },
      {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "client" as const,
      },
    ];

    // Insert users
    const createdUsers = await User.insertMany(testUsers);
    console.log(`Created ${createdUsers.length} test users:`);

    createdUsers.forEach((user) => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    console.log("\nYou can now login with:");
    console.log("Client: client@test.com / password123");
    console.log("Admin: admin@test.com / password123");

  } catch (error) {
    console.error("Error seeding users:", error);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  }
};

seedUsers();