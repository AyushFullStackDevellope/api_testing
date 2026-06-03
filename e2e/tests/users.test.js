const { UsersAPI } = require('../pages/UsersAPI');
const { getAuthToken } = require('../fixtures/index');
const {
  validateSuccessResponse,
  validateListResponse,
  validateErrorResponse,
} = require("../helpers/validators");

describe('POST /users - User Creation', () => {
  let usersAPI;
  let token;

  // valid user payload (email must be unique per test run)
  const getValidUser = () => ({
    first_name: 'John',
    last_name: 'Doe',
    email: `john.doe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@example.com`,
    password: 'Secret123',
    mobile: '1234567890',
  });

  beforeAll(async () => {
    usersAPI = new UsersAPI();
    token = await getAuthToken();
  });

  // ─── Valid Creation ────────────────────────────────────────────
  test('verify user creation with valid data', async () => {
    const validUser = getValidUser();
    const res = await usersAPI.create(validUser, token);

    const data = validateSuccessResponse(res, 200);
    expect(data).toMatchObject({
      first_name: validUser.first_name,
      last_name: validUser.last_name,
      email: validUser.email,
      mobile: validUser.mobile,
    });
    expect(data).toHaveProperty('full_name', `${validUser.first_name} ${validUser.last_name}`);
    expect(data).toHaveProperty('status', 'active');
    expect(data).not.toHaveProperty('password_hash');
  });

  // ─── Missing Required Fields ───────────────────────────────────
  test('verify user creation with missing first name', async () => {
    const { first_name, ...body } = getValidUser();
    const res = await usersAPI.create(body, token);
    validateErrorResponse(res, 400);
  });

  test('verify user creation with missing last name', async () => {
    const { last_name, ...body } = getValidUser();
    const res = await usersAPI.create(body, token);
    validateErrorResponse(res, 400);
  });

  test('verify user creation with missing email', async () => {
    const { email, ...body } = getValidUser();
    const res = await usersAPI.create(body, token);
    validateErrorResponse(res, 400);
  });

  test('verify user creation with missing password', async () => {
    const { password, ...body } = getValidUser();
    const res = await usersAPI.create(body, token);
    validateErrorResponse(res, 400);
  });

  // ─── Duplicate Email ────────────────────────────────────────
  test('verify user creation with duplicate email', async () => {
    const validUser = getValidUser();
    // first create
    const res1 = await usersAPI.create(validUser, token);
    validateSuccessResponse(res1, 200);

    // second create with duplicate email
    const res2 = await usersAPI.create(validUser, token);
    validateErrorResponse(res2, 409);
  });

  // ─── Optional Mobile ────────────────────────────────────────
  test('verify user creation with mobile number', async () => {
    const userWithMobile = getValidUser();
    const res = await usersAPI.create(userWithMobile, token);
    const data = validateSuccessResponse(res, 200);
    expect(data).toHaveProperty('mobile', userWithMobile.mobile);
  });

  // ─── Empty Body ───────────────────────────────────────────────
  test('verify user creation with empty request body', async () => {
    const res = await usersAPI.create({}, token);
    validateErrorResponse(res, 400);
  });

  // ─── Response Format ───────────────────────────────────────
  test('verify API response format for user creation', async () => {
    const newUser = getValidUser();
    const res = await usersAPI.create(newUser, token);
    const data = validateSuccessResponse(res, 200);
    expect(data).toMatchObject({
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      email: newUser.email,
    });
  });
});

// ────────────────────────────────────────────────────────────────────────

describe('GET /users - Fetch Users', () => {
  let usersAPI;
  let token;

  const getValidUser = () => ({
    first_name: 'John',
    last_name: 'Doe',
    email: `john.doe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@example.com`,
    password: 'Secret123',
    mobile: '1234567890',
  });

  beforeAll(async () => {
    usersAPI = new UsersAPI();
    token = await getAuthToken();
  });

  test('verify fetching all active users', async () => {
    const validUser = getValidUser();
    await usersAPI.create(validUser, token);

    const res = await usersAPI.getAll(token);
    const data = validateListResponse(res, 200);
    expect(data.length).toBeGreaterThan(0);
  });

  test('verify users list response format', async () => {
    const res = await usersAPI.getAll(token);
    validateListResponse(res, 200);
  });

  test('verify users are sorted by latest id', async () => {
    const user1 = getValidUser();
    const user2 = getValidUser();
    const res1 = await usersAPI.create(user1, token);
    const id1 = validateSuccessResponse(res1, 200).id;
    const res2 = await usersAPI.create(user2, token);
    const id2 = validateSuccessResponse(res2, 200).id;

    const res = await usersAPI.getAll(token);
    const data = validateListResponse(res, 200);
    const ids = data.map(u => u.id);
    const idx1 = ids.indexOf(id1);
    const idx2 = ids.indexOf(id2);

    expect(idx1).toBeGreaterThan(-1);
    expect(idx2).toBeGreaterThan(-1);
    expect(idx2).toBeLessThan(idx1); // id2 created later, must be first
  });

  test('verify inactive users are not returned', async () => {
    const res = await usersAPI.getAll(token);
    const data = validateListResponse(res, 200);
    const hasInactive = data.some(u => u.status === 'inactive');
    expect(hasInactive).toBe(false);
  });

  test('verify success message for users list API', async () => {
    const res = await usersAPI.getAll(token);
    validateListResponse(res, 200);
    expect(typeof res.body.message).toBe('string');
  });
});