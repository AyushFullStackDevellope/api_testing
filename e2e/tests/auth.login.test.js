const { loginRequest, loginWithToken } = require("../helpers/api.helpers");
const { env } = require("../constants/env");
const {
  validateJSONHeaders,
  validateErrorResponse,
} = require("../helpers/validators");

describe("POST /auth/login", () => {
  // ─── Valid Login ───────────────────────────────────────────────

  test("verify login with valid email and password", async () => {
    const res = await loginRequest({
      email: env.adminEmail(),
      password: env.adminPassword(),
    });

    validateJSONHeaders(res, 200);
    expect(res.body).toHaveProperty("success", true);
  });

  // ─── Wrong / Invalid Credentials ──────────────────────────────

  test("verify login with wrong password", async () => {
    const res = await loginRequest({
      email: env.adminEmail(),
      password: "wrongpassword123",
    });

    validateErrorResponse(res, 401);
  });

  test("verify login with invalid email", async () => {
    const res = await loginRequest({
      email: "notanemail",
      password: env.adminPassword(),
    });

    validateErrorResponse(res, 400);
  });

  // ─── Empty Fields ──────────────────────────────────────────────

  test("verify login with empty email field", async () => {
    const res = await loginRequest({
      email: "",
      password: env.adminPassword(),
    });

    validateErrorResponse(res, 400);
  });

  test("verify login with empty password field", async () => {
    const res = await loginRequest({
      email: env.adminEmail(),
      password: "",
    });

    validateErrorResponse(res, 400);
  });

  test("verify login with empty request body", async () => {
    const res = await loginRequest({});

    validateErrorResponse(res, 400);
  });

  // ─── Missing Fields ────────────────────────────────────────────

  test("verify login with missing password field", async () => {
    const res = await loginRequest({
      email: env.adminEmail(),
    });

    validateErrorResponse(res, 400);
  });

  test("verify login with missing email field", async () => {
    const res = await loginRequest({
      password: env.adminPassword(),
    });

    validateErrorResponse(res, 400);
  });

  // ─── Null Values ───────────────────────────────────────────────

  test("verify login with null email and password", async () => {
    const res = await loginRequest({
      email: null,
      password: null,
    });

    validateErrorResponse(res, 400);
  });

  // ─── Token ─────────────────────────────────────────────────────

  test("verify pre_context_token is generated after successful login", async () => {
    const res = await loginRequest({
      email: env.adminEmail(),
      password: env.adminPassword(),
    });

    validateJSONHeaders(res, 200);
    expect(res.body).toHaveProperty("pre_context_token");
    expect(typeof res.body.pre_context_token).toBe("string");
    expect(res.body.pre_context_token.length).toBeGreaterThan(0);
  });

  test("verify API with invalid token", async () => {
    const res = await loginWithToken("invalid.token.here");

    validateErrorResponse(res, 401);
  });

  test("verify API without authorization token", async () => {
    const res = await loginWithToken("");

    validateErrorResponse(res, 401);
  });

  // ─── Response Shape ────────────────────────────────────────────

  test("verify user details in login response", async () => {
    const res = await loginRequest({
      email: env.adminEmail(),
      password: env.adminPassword(),
    });

    validateJSONHeaders(res, 200);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("email");
  });

  test("verify API response format is JSON", async () => {
    const res = await loginRequest({
      email: env.adminEmail(),
      password: env.adminPassword(),
    });

    validateJSONHeaders(res, 200);
    expect(typeof res.body).toBe("object");
  });

  test("verify response message after successful login", async () => {
    const res = await loginRequest({
      email: env.adminEmail(),
      password: env.adminPassword(),
    });

    validateJSONHeaders(res, 200);
    expect(res.body).toHaveProperty("message");
    expect(typeof res.body.message).toBe("string");
  });

  // ─── Edge Cases ────────────────────────────────────────────────

  test("verify login with inactive user account", async () => {
    const res = await loginRequest({
      email: process.env.TEST_INACTIVE_EMAIL || "inactive@test.com",
      password: process.env.TEST_INACTIVE_PASSWORD || "inactive123",
    });

    validateErrorResponse(res, 403);
  });

  test("verify login with SQL injection input", async () => {
    const res = await loginRequest({
      email: "' OR '1'='1",
      password: "' OR '1'='1",
    });

    validateErrorResponse(res, 400);
  });
});