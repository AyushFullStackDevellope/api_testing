const { InstitutesAPI } = require("../pages/InstitutesAPI");
const { getAuthToken } = require("../fixtures/index");

describe("POST /institutes - Institute Creation", () => {
  let institutesAPI;
  let token;

  // valid institute payload
  const validInstitute = {
    tenant_id: 1,
    name: "Test Institute",
    code: `INST_${Date.now()}`, // unique code per run
    type: "school",
  };

  beforeAll(async () => {
    institutesAPI = new InstitutesAPI();
    token = await getAuthToken();
  });

  // ─── Valid Creation ────────────────────────────────────────────

  test("verify institute creation with valid data", async () => {
    const res = await institutesAPI.create(validInstitute, token);

    expect(res.status).toBe(201);
  });

  // ─── Missing Required Fields ───────────────────────────────────

  test("verify institute creation with missing tenant_id", async () => {
    const { tenant_id, ...body } = validInstitute;

    const res = await institutesAPI.create(body, token);

    expect(res.status).toBe(400);
  });

  test("verify institute creation with missing name", async () => {
    const { name, ...body } = validInstitute;

    const res = await institutesAPI.create(body, token);

    expect(res.status).toBe(400);
  });

  test("verify institute creation with missing code", async () => {
    const { code, ...body } = validInstitute;

    const res = await institutesAPI.create(body, token);

    expect(res.status).toBe(400);
  });

  test("verify institute creation with missing type", async () => {
    const { type, ...body } = validInstitute;

    const res = await institutesAPI.create(body, token);

    expect(res.status).toBe(400);
  });

  // ─── Duplicate ─────────────────────────────────────────────────

  test("verify institute creation with duplicate code", async () => {
    // first create
    await institutesAPI.create(
      { ...validInstitute, code: "DUPLICATE_CODE" },
      token
    );

    // second create with same code
    const res = await institutesAPI.create(
      { ...validInstitute, code: "DUPLICATE_CODE" },
      token
    );

    expect(res.status).toBe(409);
  });

  // ─── Optional Fields ───────────────────────────────────────────

  test("verify institute creation with optional fields", async () => {
    const res = await institutesAPI.create(
      {
        ...validInstitute,
        code: `INST_OPT_${Date.now()}`,
        description: "Optional description",
        address: "123 Test Street",
      },
      token
    );

    expect(res.status).toBe(201);
  });

  // ─── Default Status ────────────────────────────────────────────

  test("verify default status is active during institute creation", async () => {
    const res = await institutesAPI.create(
      { ...validInstitute, code: `INST_STATUS_${Date.now()}` },
      token
    );

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("status");
    expect(res.body.status).toBe("active");
  });

  // ─── Response Format ───────────────────────────────────────────

  test("verify API response format for institute creation", async () => {
    const res = await institutesAPI.create(
      { ...validInstitute, code: `INST_FMT_${Date.now()}` },
      token
    );

    expect(res.status).toBe(201);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(typeof res.body).toBe("object");
  });

  // ─── Empty Body ────────────────────────────────────────────────

  test("verify institute creation with empty request body", async () => {
    const res = await institutesAPI.create({}, token);

    expect(res.status).toBe(400);
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

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ─── Response Format ───────────────────────────────────────────

  test("verify institute list response format", async () => {
    const res = await institutesAPI.getAll(token);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ─── Sorting ───────────────────────────────────────────────────

  test("verify institutes are sorted by latest id", async () => {
    const res = await institutesAPI.getAll(token);

    expect(res.status).toBe(200);

    const ids = res.body.map((inst) => inst.id);
    const sortedDesc = [...ids].sort((a, b) => b - a);

    expect(ids).toEqual(sortedDesc);
  });

  // ─── Inactive Institutes ───────────────────────────────────────

  test("verify inactive institutes are not returned", async () => {
    const res = await institutesAPI.getAll(token);

    expect(res.status).toBe(200);

    const hasInactive = res.body.some((inst) => inst.status === "inactive");
    expect(hasInactive).toBe(false);
  });

  // ─── Success Message ───────────────────────────────────────────

  test("verify success message for institute list API", async () => {
    const res = await institutesAPI.getAll(token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(typeof res.body.message).toBe("string");
  });
});