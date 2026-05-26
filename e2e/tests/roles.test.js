const { RolesAPI } = require("../pages/RolesAPI");
const { getAuthToken } = require("../fixtures/index");

describe("POST /roles - Role Creation", () => {
  let rolesAPI;
  let token;

  // valid role payload
  const validRole = {
    name: "Test Role",
    code: `ROLE_${Date.now()}`, // unique code per run
  };

  beforeAll(async () => {
    rolesAPI = new RolesAPI();
    token = await getAuthToken();
  });

  // ─── Valid Creation ────────────────────────────────────────────

  test("verify role creation with valid data", async () => {
    const res = await rolesAPI.create(validRole, token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("name", validRole.name);
    expect(res.body.data).toHaveProperty("code");
  });

  // ─── Missing Required Fields ───────────────────────────────────

  test("verify role creation with missing name", async () => {
    const { name, ...body } = validRole;

    const res = await rolesAPI.create(body, token);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("success", false);
  });

  test("verify role creation with missing code", async () => {
    const { code, ...body } = validRole;

    const res = await rolesAPI.create(body, token);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("success", false);
  });

  // ─── Empty Body ────────────────────────────────────────────────

  test("verify role creation with empty request body", async () => {
    const res = await rolesAPI.create({}, token);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("success", false);
  });

  // ─── Duplicate ─────────────────────────────────────────────────

  test("verify role creation with duplicate code", async () => {
    // first create
    await rolesAPI.create(
      { ...validRole, code: "DUPLICATE_ROLE_CODE" },
      token
    );

    // second create with same code
    const res = await rolesAPI.create(
      { ...validRole, code: "DUPLICATE_ROLE_CODE" },
      token
    );

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("success", false);
  });

  // ─── Optional Fields ───────────────────────────────────────────

  test("verify role creation with description field", async () => {
    const res = await rolesAPI.create(
      {
        ...validRole,
        code: `ROLE_DESC_${Date.now()}`,
        description: "A role with description",
      },
      token
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("description", "A role with description");
  });

  // ─── Default Status ────────────────────────────────────────────

  test("verify default status during role creation", async () => {
    const res = await rolesAPI.create(
      { ...validRole, code: `ROLE_STATUS_${Date.now()}` },
      token
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("status", "active");
  });

  // ─── Response Format ───────────────────────────────────────────

  test("verify API response format for role creation", async () => {
    const res = await rolesAPI.create(
      { ...validRole, code: `ROLE_FMT_${Date.now()}` },
      token
    );

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(typeof res.body).toBe("object");
    expect(res.body).toHaveProperty("success");
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("data");
  });

  // ─── Special Characters ────────────────────────────────────────

  test("verify role creation with special characters in name", async () => {
    const res = await rolesAPI.create(
      {
        name: "Rôle Spéciàl @#$%",
        code: `ROLE_SPECIAL_${Date.now()}`,
      },
      token
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("name", "Rôle Spéciàl @#$%");
  });

  // ─── Internal Server Error ─────────────────────────────────────

  test("verify internal server error handling during role creation", async () => {
    // send a payload with a value type the DB cannot handle
    const res = await rolesAPI.create(
      {
        name: "Error Role",
        code: `ROLE_ERR_${Date.now()}`,
        status: { invalid: true }, // object instead of string triggers DB error
      },
      token
    );

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("success", false);
  });
});

// ─────────────────────────────────────────────────────────────────

describe("GET /roles - Fetch Roles", () => {
  let rolesAPI;
  let token;

  beforeAll(async () => {
    rolesAPI = new RolesAPI();
    token = await getAuthToken();
  });

  // ─── Fetch Active ──────────────────────────────────────────────

  test("verify fetching all active roles", async () => {
    const res = await rolesAPI.getAll(token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ─── Response Format ───────────────────────────────────────────

  test("verify role list response format", async () => {
    const res = await rolesAPI.getAll(token);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("data");
  });

  // ─── Sorting ───────────────────────────────────────────────────

  test("verify roles are sorted by latest id", async () => {
    const res = await rolesAPI.getAll(token);

    expect(res.status).toBe(200);

    const ids = res.body.data.map((role) => role.id);
    const sortedDesc = [...ids].sort((a, b) => b - a);

    expect(ids).toEqual(sortedDesc);
  });

  // ─── Inactive Roles ────────────────────────────────────────────

  test("verify inactive roles are not returned", async () => {
    const res = await rolesAPI.getAll(token);

    expect(res.status).toBe(200);

    const hasInactive = res.body.data.some((role) => role.status === "inactive");
    expect(hasInactive).toBe(false);
  });

  // ─── Success Message ───────────────────────────────────────────

  test("verify success message for role list API", async () => {
    const res = await rolesAPI.getAll(token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(typeof res.body.message).toBe("string");
  });
});
