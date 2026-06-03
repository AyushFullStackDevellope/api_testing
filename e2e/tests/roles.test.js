const { RolesAPI } = require("../pages/RolesAPI");
const { getAuthToken } = require("../fixtures/index");
const {
  validateSuccessResponse,
  validateListResponse,
  validateErrorResponse,
} = require("../helpers/validators");

describe("POST /roles - Role Creation", () => {
  let rolesAPI;
  let token;

  const getPayload = () => ({
    name: "Test Role",
    code: `ROLE_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  });

  beforeAll(async () => {
    rolesAPI = new RolesAPI();
    token = await getAuthToken();
  });

  test("verify role creation with valid data", async () => {
    const payload = getPayload();
    const res = await rolesAPI.create(payload, token);
    const data = validateSuccessResponse(res, 200);
    expect(data).toHaveProperty("name", payload.name);
    expect(data).toHaveProperty("code");
  });

  test("verify role creation with missing name", async () => {
    const { name, ...body } = getPayload();
    const res = await rolesAPI.create(body, token);
    validateErrorResponse(res, 400);
  });

  test("verify role creation with missing code", async () => {
    const { code, ...body } = getPayload();
    const res = await rolesAPI.create(body, token);
    validateErrorResponse(res, 400);
  });

  test("verify role creation with empty request body", async () => {
    const res = await rolesAPI.create({}, token);
    validateErrorResponse(res, 400);
  });

  test("verify role creation with duplicate code", async () => {
    const duplicateCode = `DUP_ROLE_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payload1 = getPayload();
    payload1.code = duplicateCode;
    const res1 = await rolesAPI.create(payload1, token);
    validateSuccessResponse(res1, 200);

    const payload2 = getPayload();
    payload2.code = duplicateCode;
    const res2 = await rolesAPI.create(payload2, token);
    validateErrorResponse(res2, 409);
  });

  test("verify role creation with description field", async () => {
    const payload = getPayload();
    payload.description = "A role with description";
    const res = await rolesAPI.create(payload, token);
    const data = validateSuccessResponse(res, 200);
    expect(data).toHaveProperty("description", "A role with description");
  });

  test("verify default status during role creation", async () => {
    const payload = getPayload();
    const res = await rolesAPI.create(payload, token);
    const data = validateSuccessResponse(res, 200);
    expect(data).toHaveProperty("status", "active");
  });

  test("verify API response format for role creation", async () => {
    const payload = getPayload();
    const res = await rolesAPI.create(payload, token);
    validateSuccessResponse(res, 200);
  });

  test("verify role creation with special characters in name", async () => {
    const payload = getPayload();
    payload.name = "Rôle Spéciàl @#$%";
    const res = await rolesAPI.create(payload, token);
    const data = validateSuccessResponse(res, 200);
    expect(data).toHaveProperty("name", "Rôle Spéciàl @#$%");
  });

  test("verify internal server error handling during role creation", async () => {
    const payload = getPayload();
    payload.code = "A".repeat(150); // Exceeds VARCHAR(100) limit, triggers DB error
    const res = await rolesAPI.create(payload, token);
    validateErrorResponse(res, 500);
  });
});

describe("GET /roles - Fetch Roles", () => {
  let rolesAPI;
  let token;

  const getPayload = () => ({
    name: "Test Role",
    code: `ROLE_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  });

  beforeAll(async () => {
    rolesAPI = new RolesAPI();
    token = await getAuthToken();
  });

  test("verify fetching all active roles", async () => {
    const payload = getPayload();
    await rolesAPI.create(payload, token);

    const res = await rolesAPI.getAll(token);
    const data = validateListResponse(res, 200);
    expect(data.length).toBeGreaterThan(0);
  });

  test("verify role list response format", async () => {
    const res = await rolesAPI.getAll(token);
    validateListResponse(res, 200);
  });

  test("verify roles are sorted by latest id", async () => {
    const role1 = getPayload();
    const role2 = getPayload();
    const res1 = await rolesAPI.create(role1, token);
    const id1 = validateSuccessResponse(res1, 200).id;
    const res2 = await rolesAPI.create(role2, token);
    const id2 = validateSuccessResponse(res2, 200).id;

    const res = await rolesAPI.getAll(token);
    const data = validateListResponse(res, 200);

    const ids = data.map((role) => role.id);
    const idx1 = ids.indexOf(id1);
    const idx2 = ids.indexOf(id2);

    expect(idx1).toBeGreaterThan(-1);
    expect(idx2).toBeGreaterThan(-1);
    expect(idx2).toBeLessThan(idx1); // id2 created later, must be first
  });

  test("verify inactive roles are not returned", async () => {
    const res = await rolesAPI.getAll(token);
    const data = validateListResponse(res, 200);

    const hasInactive = data.some((role) => role.status === "inactive");
    expect(hasInactive).toBe(false);
  });

  test("verify success message for role list API", async () => {
    const res = await rolesAPI.getAll(token);
    validateListResponse(res, 200);
    expect(typeof res.body.message).toBe("string");
  });
});
