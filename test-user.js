// Quick script to create a test user via the registration API
const fetch = require("node-fetch");

async function createTestUser() {
  try {
    const response = await fetch("http://localhost:7002/api/v1/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        role: "client",
      }),
    });

    const data = await response.json();
    console.log("Test user created:", data);
  } catch (error) {
    console.error("Error creating test user:", error);
  }
}

createTestUser();
