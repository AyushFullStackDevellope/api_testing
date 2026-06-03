const request = require("supertest");
const { env } = require("../constants/env");

// Helper to get a Supertest instance pointed at the base URL
const getApp = () => request(env.baseURL());

// Shared API request wrapper
const apiRequest = (method, path, body = null, token = null, query = null) => {
  let req = getApp()[method.toLowerCase()](path);
  if (query) {
    req = req.query(query);
  }
  if (body) {
    req = req.send(body).set("Content-Type", "application/json");
  }
  if (token) {
    req = req.set("Authorization", `Bearer ${token}`);
  }
  return req;
};

// POST /auth/login with body
const loginRequest = (body) => apiRequest("POST", "/auth/login", body);

// GET /auth/me with bearer token (used to validate token)
const loginWithToken = (token) => apiRequest("GET", "/auth/me", null, token);

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

module.exports = { getApp, apiRequest, loginRequest, loginWithToken, getAuthToken };