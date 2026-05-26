// e2e/tests/mapping.test.js
const { MappingAPI } = require('../pages/MappingAPI');
const { getAuthToken } = require('../fixtures/index');

describe('POST /user-institute-roles - Mapping Creation', () => {
  let mappingAPI;
  let token;

  const baseMapping = {
    tenant_id: 1,
    user_id: 1,
    institute_id: 1,
    role_id: 1,
  };

  beforeAll(async () => {
    mappingAPI = new MappingAPI();
    token = await getAuthToken();
  });

  // ── Valid Creation ───────────────────────────────────────────────────────────────────────
  test('verify mapping creation with valid data', async () => {
    const res = await mappingAPI.create(baseMapping, token);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    const { data } = res.body;
    expect(data).toMatchObject({
      tenant_id: baseMapping.tenant_id,
      user_id: baseMapping.user_id,
      institute_id: baseMapping.institute_id,
      role_id: baseMapping.role_id,
    });
  });

  // ── Missing Fields ───────────────────────────────────────────────────────────────────────
  test('verify mapping creation with missing tenant_id', async () => {
    const { tenant_id, ...payload } = baseMapping;
    const res = await mappingAPI.create(payload, token);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  test('verify mapping creation with missing user_id', async () => {
    const { user_id, ...payload } = baseMapping;
    const res = await mappingAPI.create(payload, token);
    expect(res.status).toBe(400);
  });

  test('verify mapping creation with missing institute_id', async () => {
    const { institute_id, ...payload } = baseMapping;
    const res = await mappingAPI.create(payload, token);
    expect(res.status).toBe(400);
  });

  test('verify mapping creation with missing role_id', async () => {
    const { role_id, ...payload } = baseMapping;
    const res = await mappingAPI.create(payload, token);
    expect(res.status).toBe(400);
  });

  // ── Duplicate ───────────────────────────────────────────────────────────────────────
  test('verify mapping creation with duplicate data', async () => {
    // First create (already succeeded above)
    const duplicate = { ...baseMapping };
    const res = await mappingAPI.create(duplicate, token);
    expect(res.status).toBe(409);
  });

  // ── is_primary handling ───────────────────────────────────────────────────────
  test('verify mapping creation with is_primary field', async () => {
    const payload = { ...baseMapping, is_primary: true };
    const res = await mappingAPI.create(payload, token);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('is_primary', true);
  });

  test('verify default is_primary value', async () => {
    const res = await mappingAPI.create(baseMapping, token);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('is_primary', false);
  });

  test('verify default status during mapping creation', async () => {
    const res = await mappingAPI.create(baseMapping, token);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('status', 'active');
  });

  test('verify API response format for mapping creation', async () => {
    const payload = { ...baseMapping, is_primary: false };
    const res = await mappingAPI.create(payload, token);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: expect.any(String),
      data: expect.objectContaining({
        tenant_id: baseMapping.tenant_id,
        user_id: baseMapping.user_id,
        institute_id: baseMapping.institute_id,
        role_id: baseMapping.role_id,
      }),
    });
  });

  test('verify mapping creation with empty request body', async () => {
    const res = await mappingAPI.create({}, token);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────
// GET /user-institute-roles – Fetch Mappings
describe('GET /user-institute-roles - Fetch Mappings', () => {
  let mappingAPI;
  let token;

  beforeAll(async () => {
    mappingAPI = new MappingAPI();
    token = await getAuthToken();
  });

  test('verify fetching all active mappings', async () => {
    const res = await mappingAPI.getAll(token);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('verify fetching mappings using user_id filter', async () => {
    const filter = { user_id: 1 };
    const res = await mappingAPI.getAll(token, filter);
    expect(res.status).toBe(200);
    expect(res.body.data.every(m => m.user_id === 1)).toBe(true);
  });

  test('verify mappings list response format', async () => {
    const res = await mappingAPI.getAll(token);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test('verify mappings are sorted by latest id', async () => {
    const res = await mappingAPI.getAll(token);
    const ids = res.body.data.map(m => m.id);
    const sortedDesc = [...ids].sort((a, b) => b - a);
    expect(ids).toEqual(sortedDesc);
  });

  test('verify inactive mappings are not returned', async () => {
    const res = await mappingAPI.getAll(token);
    const hasInactive = res.body.data.some(m => m.status === 'inactive');
    expect(hasInactive).toBe(false);
  });

  test('verify success message for mappings list API', async () => {
    const res = await mappingAPI.getAll(token);
    expect(res.body).toHaveProperty('message');
    expect(typeof res.body.message).toBe('string');
  });

  // Internal server error handling – placeholder (cannot reliably trigger DB error)
  test.skip('verify internal server error handling during mapping creation', async () => {
    // Skipped because simulating a DB failure requires mocking the DB layer.
  });
});
