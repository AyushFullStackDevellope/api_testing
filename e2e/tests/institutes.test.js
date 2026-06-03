const { InstitutesAPI } = require("../pages/InstitutesAPI");
const { getAuthToken } = require("../fixtures/index");
const { createTestTenant } = require("../helpers/setup");
const {
  validateSuccessResponse,
  validateListResponse,
  validateErrorResponse,
} = require("../helpers/validators");

describe("POST /institutes - Institute Creation", () => {
  let institutesAPI;
  let token;
  let dynamicTenant;

  const getPayload = () => ({
    tenant_id: dynamicTenant.id,
    name: "Test Institute",
    code: `INST_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: "school",
  });

  beforeAll(async () => {
    institutesAPI = new InstitutesAPI();
    token = await getAuthToken();
    dynamicTenant = await createTestTenant(token);
  });

  // ─── Valid Creation ────────────────────────────────────────────

  test("verify institute creation with valid data", async () => {
    const payload = getPayload();
    const res = await institutesAPI.create(payload, token);
    const data = validateSuccessResponse(res, 200);
    expect(data.name).toBe(payload.name);
  });

  // ─── Missing Required Fields ───────────────────────────────────

  test("verify institute creation with missing tenant_id", async () => {
    const { tenant_id, ...body } = getPayload();
    const res = await institutesAPI.create(body, token);
    validateErrorResponse(res, 400);
  });

  test("verify institute creation with missing name", async () => {
    const { name, ...body } = getPayload();
    const res = await institutesAPI.create(body, token);
    validateErrorResponse(res, 400);
  });

  test("verify institute creation with missing code", async () => {
    const { code, ...body } = getPayload();
    const res = await institutesAPI.create(body, token);
    validateErrorResponse(res, 400);
  });

  test("verify institute creation with missing type", async () => {
    const { type, ...body } = getPayload();
    const res = await institutesAPI.create(body, token);
    validateErrorResponse(res, 400);
  });

  // ─── Duplicate ─────────────────────────────────────────────────

  test("verify institute creation with duplicate code", async () => {
    const payload = getPayload();
    payload.code = "DUPLICATE_CODE";

    // first create
    await institutesAPI.create(payload, token);

    // second create with same code
    const res = await institutesAPI.create(payload, token);
    validateErrorResponse(res, 409);
  });

  // ─── Optional Fields ───────────────────────────────────────────

  test("verify institute creation with optional fields", async () => {
    const payload = getPayload();
    payload.description = "Optional description";
    payload.address = "123 Test Street";
    const res = await institutesAPI.create(payload, token);
    const data = validateSuccessResponse(res, 200);
    expect(data.description).toBe("Optional description");
  });

  // ─── Default Status ────────────────────────────────────────────

  test("verify default status is active during institute creation", async () => {
    const payload = getPayload();
    const res = await institutesAPI.create(payload, token);
    const data = validateSuccessResponse(res, 200);
    expect(data.status).toBe("active");
  });

  // ─── Response Format ───────────────────────────────────────────

  test("verify API response format for institute creation", async () => {
    const payload = getPayload();
    const res = await institutesAPI.create(payload, token);
    validateSuccessResponse(res, 200);
  });

  // ─── Empty Body ────────────────────────────────────────────────

  test("verify institute creation with empty request body", async () => {
    const res = await institutesAPI.create({}, token);
    validateErrorResponse(res, 400);
  });
});

// ─────────────────────────────────────────────────────────────────

describe("GET /institutes - Fetch Institutes", () => {
  let institutesAPI;
  let token;

  beforeAll(async () => {
    institutesAPI = new InstitutesAPI();
    token = await getAuthToken();
  });

  // ─── Fetch Active ──────────────────────────────────────────────

  test("verify fetching all active institutes", async () => {
    const res = await institutesAPI.getAll(token);
    const data = validateListResponse(res, 200);
    expect(data.length).toBeGreaterThan(0);
  });

  // ─── Response Format ───────────────────────────────────────────

  test("verify institute list response format", async () => {
    const res = await institutesAPI.getAll(token);
    validateListResponse(res, 200);
  });

  // ─── Sorting ───────────────────────────────────────────────────

  test("verify institutes are sorted by latest id", async () => {
    const res = await institutesAPI.getAll(token);
    const data = validateListResponse(res, 200);

    const ids = data.map((inst) => inst.id);
    const sortedDesc = [...ids].sort((a, b) => b - a);

    expect(ids).toEqual(sortedDesc);
  });

  // ─── Inactive Institutes ───────────────────────────────────────

  test("verify inactive institutes are not returned", async () => {
    const res = await institutesAPI.getAll(token);
    const data = validateListResponse(res, 200);

    const hasInactive = data.some((inst) => inst.status === "inactive");
    expect(hasInactive).toBe(false);
  });

  // ─── Success Message ───────────────────────────────────────────

  test("verify success message for institute list API", async () => {
    const res = await institutesAPI.getAll(token);
    validateListResponse(res, 200);
    expect(typeof res.body.message).toBe("string");
  });
});