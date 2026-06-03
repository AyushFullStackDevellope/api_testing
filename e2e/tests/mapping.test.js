const { MappingAPI } = require('../pages/MappingAPI');
const { getAuthToken } = require('../fixtures/index');
const { getDynamicSetupData } = require('../helpers/setup');
const {
  validateSuccessResponse,
  validateListResponse,
  validateErrorResponse,
} = require("../helpers/validators");

describe('POST /user-institute-roles - Mapping Creation', () => {
  let mappingAPI;
  let token;

  const getPayload = async () => {
    const freshSetup = await getDynamicSetupData(token);
    return {
      tenant_id: freshSetup.tenant_id,
      user_id: freshSetup.user_id,
      institute_id: freshSetup.institute_id,
      role_id: freshSetup.role_id,
    };
  };

  beforeAll(async () => {
    mappingAPI = new MappingAPI();
    token = await getAuthToken();
  });

  // ── Valid Creation ───────────────────────────────────────────────────────────────────────
  test('verify mapping creation with valid data', async () => {
    const payload = await getPayload();
    const res = await mappingAPI.create(payload, token);
    const data = validateSuccessResponse(res, 200);
    expect(data).toMatchObject({
      tenant_id: payload.tenant_id,
      user_id: payload.user_id,
      institute_id: payload.institute_id,
      role_id: payload.role_id,
    });
  });

  // ── Missing Fields ───────────────────────────────────────────────────────────────────────
  test('verify mapping creation with missing tenant_id', async () => {
    const payload = await getPayload();
    const { tenant_id, ...body } = payload;
    const res = await mappingAPI.create(body, token);
    validateErrorResponse(res, 400);
  });

  test('verify mapping creation with missing user_id', async () => {
    const payload = await getPayload();
    const { user_id, ...body } = payload;
    const res = await mappingAPI.create(body, token);
    validateErrorResponse(res, 400);
  });

  test('verify mapping creation with missing institute_id', async () => {
    const payload = await getPayload();
    const { institute_id, ...body } = payload;
    const res = await mappingAPI.create(body, token);
    validateErrorResponse(res, 400);
  });

  test('verify mapping creation with missing role_id', async () => {
    const payload = await getPayload();
    const { role_id, ...body } = payload;
    const res = await mappingAPI.create(body, token);
    validateErrorResponse(res, 400);
  });

  // ── Duplicate ───────────────────────────────────────────────────────────────────────
  test('verify mapping creation with duplicate data', async () => {
    const payload = await getPayload();
    
    // First create
    const res1 = await mappingAPI.create(payload, token);
    validateSuccessResponse(res1, 200);

    // Second create of the same mapping
    const res2 = await mappingAPI.create(payload, token);
    validateErrorResponse(res2, 409);
  });

  // ── is_primary handling ───────────────────────────────────────────────────────
  test('verify mapping creation with is_primary field', async () => {
    const payload = await getPayload();
    payload.is_primary = true;
    const res = await mappingAPI.create(payload, token);
    const data = validateSuccessResponse(res, 200);
    expect(data).toHaveProperty('is_primary', true);
  });

  test('verify default is_primary value', async () => {
    const payload = await getPayload();
    const res = await mappingAPI.create(payload, token);
    const data = validateSuccessResponse(res, 200);
    expect(data).toHaveProperty('is_primary', false);
  });

  test('verify default status during mapping creation', async () => {
    const payload = await getPayload();
    const res = await mappingAPI.create(payload, token);
    const data = validateSuccessResponse(res, 200);
    expect(data).toHaveProperty('status', 'active');
  });

  test('verify API response format for mapping creation', async () => {
    const payload = await getPayload();
    payload.is_primary = false;
    const res = await mappingAPI.create(payload, token);
    const data = validateSuccessResponse(res, 200);
    expect(data).toMatchObject({
      tenant_id: payload.tenant_id,
      user_id: payload.user_id,
      institute_id: payload.institute_id,
      role_id: payload.role_id,
    });
  });

  test('verify mapping creation with empty request body', async () => {
    const res = await mappingAPI.create({}, token);
    validateErrorResponse(res, 400);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────
// GET /user-institute-roles – Fetch Mappings
describe('GET /user-institute-roles - Fetch Mappings', () => {
  let mappingAPI;
  let token;

  const getPayload = async () => {
    const freshSetup = await getDynamicSetupData(token);
    return {
      tenant_id: freshSetup.tenant_id,
      user_id: freshSetup.user_id,
      institute_id: freshSetup.institute_id,
      role_id: freshSetup.role_id,
    };
  };

  beforeAll(async () => {
    mappingAPI = new MappingAPI();
    token = await getAuthToken();
  });

  test('verify fetching all active mappings', async () => {
    const payload = await getPayload();
    await mappingAPI.create(payload, token);

    const res = await mappingAPI.getAll(token);
    const data = validateListResponse(res, 200);
    expect(data.length).toBeGreaterThan(0);
  });

  test('verify fetching mappings using user_id filter', async () => {
    const payload = await getPayload();
    await mappingAPI.create(payload, token);

    const filter = { user_id: payload.user_id };
    const res = await mappingAPI.getAll(token, filter);
    const data = validateListResponse(res, 200);
    expect(data.every(m => m.user_id === payload.user_id)).toBe(true);
  });

  test('verify mappings list response format', async () => {
    const res = await mappingAPI.getAll(token);
    validateListResponse(res, 200);
  });

  test('verify mappings are sorted by latest id', async () => {
    const payload1 = await getPayload();
    const payload2 = await getPayload();
    
    const res1 = await mappingAPI.create(payload1, token);
    const id1 = validateSuccessResponse(res1, 200).id;
    const res2 = await mappingAPI.create(payload2, token);
    const id2 = validateSuccessResponse(res2, 200).id;

    const res = await mappingAPI.getAll(token);
    const data = validateListResponse(res, 200);
    const ids = data.map(m => m.id);
    const idx1 = ids.indexOf(id1);
    const idx2 = ids.indexOf(id2);

    expect(idx1).toBeGreaterThan(-1);
    expect(idx2).toBeGreaterThan(-1);
    expect(idx2).toBeLessThan(idx1); // id2 created later, must be first
  });

  test('verify inactive mappings are not returned', async () => {
    const res = await mappingAPI.getAll(token);
    const data = validateListResponse(res, 200);
    const hasInactive = data.some(m => m.status === 'inactive');
    expect(hasInactive).toBe(false);
  });

  test('verify success message for mappings list API', async () => {
    const res = await mappingAPI.getAll(token);
    validateListResponse(res, 200);
    expect(typeof res.body.message).toBe('string');
  });
});
