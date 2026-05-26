require("dotenv").config();

const env = {
  baseURL: () => process.env.BASE_URL || "http://localhost:3000",
  adminEmail: () => process.env.TEST_ADMIN_EMAIL || "",
  adminPassword: () => process.env.TEST_ADMIN_PASSWORD || "",
};

module.exports = { env };
