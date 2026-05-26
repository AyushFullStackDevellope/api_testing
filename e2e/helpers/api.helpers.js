const request = require("supertest");
const { env } = require("../constants/env");

const getApp = () => request(env.baseURL());

const loginRequest = (body) =>
  getApp().post("/auth/login").send(body).set("Content-Type", "application/json");

const loginWithToken = (token) =>
  getApp().get("/auth/login").set("Authorization", `Bearer ${token}`);

/**
 * Logs in with admin credentials and returns the access token.
 */
const getAuthToken = async () => {
  const res = await loginRequest({
    email: env.adminEmail(),
    password: env.adminPassword(),
  });
  return res.body.pre_context_token || res.body.token || "";
};

module.exports = { getApp, loginRequest, loginWithToken, getAuthToken };
