const request = require("supertest");
const { env } = require("../constants/env");

// Helper to get a Supertest instance pointed at the base URL
const getApp = () => request(env.baseURL());

// POST /auth/login with body
const loginRequest = (body) =>
  getApp()
    .post("/auth/login")
    .send(body)
    .set("Content-Type", "application/json");

// GET /auth/me with bearer token (used to validate token)
const loginWithToken = (token) =>
  getApp()
    .get("/auth/me")
    .set("Authorization", `Bearer ${token}`);

/**
 * Logs in with admin credentials defined in .env and returns the pre‑context token.
 */
const getAuthToken = async () => {
  const res = await loginRequest({
    email: env.adminEmail(),
    password: env.adminPassword(),
  });
  return res.body.pre_context_token || res.body.token || "";
};

module.exports = { getApp, loginRequest, loginWithToken, getAuthToken };