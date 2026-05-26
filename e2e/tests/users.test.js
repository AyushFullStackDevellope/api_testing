const { UsersAPI } = require('../pages/UsersAPI');
const { getAuthToken } = require('../fixtures/index');

describe('POST /users - User Creation', () => {
  let usersAPI;
  let token;

  // valid user payload (email must be unique per test run)
  const validUser = {
    first_name: 'John',
    last_name: 'Doe',
    email: `john.doe_${Date.now()}@example.com`,
    password: 'Secret123',
    mobile: '1234567890',
  };

  beforeAll(async () => {
    usersAPI = new UsersAPI();
    token = await getAuthToken();
  });

  // ─── Valid Creation ────────────────────────────────────────────
  test('verify user creation with valid data', async () => {
    const res = await usersAPI.create(validUser, token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    const { data } = res.body;
    expect(data).toMatchObject({
      first_name: validUser.first_name,
      last_name: validUser.last_name,
      email: validUser.email,
      mobile: validUser.mobile,
    });
    // full_name generation
    expect(data).toHaveProperty('full_name', `${validUser.first_name} ${validUser.last_name}`);
    // default status
    expect(data).toHaveProperty('status', 'active');
    // password hash should not be exposed
    expect(data).not.toHaveProperty('password_hash');
  });

  // ─── Missing Required Fields ───────────────────────────────────
  test('verify user creation with missing first name', async () => {
    const { first_name, ...body } = validUser;
    const res = await usersAPI.create(body, token);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  test('verify user creation with missing last name', async () => {
    const { last_name, ...body } = validUser;
    const res = await usersAPI.create(body, token);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  test('verify user creation with missing email', async () => {
    const { email, ...body } = validUser;
    const res = await usersAPI.create(body, token);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  test('verify user creation with missing password', async () => {
    const { password, ...body } = validUser;
    const res = await usersAPI.create(body, token);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  // ─── Duplicate Email ────────────────────────────────────────
  test('verify user creation with duplicate email', async () => {
    // first create the user (already done in valid data test)
    const duplicate = { ...validUser };
    const res = await usersAPI.create(duplicate, token);
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('success', false);
  });

  // ─── Optional Mobile ────────────────────────────────────────
  test('verify user creation with mobile number', async () => {
    const userWithMobile = {
      first_name: 'Jane',
      last_name: 'Smith',
      email: `jane.smith_${Date.now()}@example.com`,
      password: 'Pass1234',
      mobile: '9876543210',
    };
    const res = await usersAPI.create(userWithMobile, token);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('mobile', userWithMobile.mobile);
  });

  // ─── Empty Body ───────────────────────────────────────────────
  test('verify user creation with empty request body', async () => {
    const res = await usersAPI.create({}, token);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  // ─── Response Format ───────────────────────────────────────
  test('verify API response format for user creation', async () => {
    const newUser = {
      first_name: 'Alice',
      last_name: 'Wonder',
      email: `alice_${Date.now()}@example.com`,
      password: 'Pwd123!',
    };
    const res = await usersAPI.create(newUser, token);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: expect.any(String),
      data: expect.objectContaining({
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
      }),
    });
  });
});

// ────────────────────────────────────────────────────────────────────────

describe('GET /users - Fetch Users', () => {
  let usersAPI;
  let token;

  beforeAll(async () => {
    usersAPI = new UsersAPI();
    token = await getAuthToken();
  });

  test('verify fetching all active users', async () => {
    const res = await usersAPI.getAll(token);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('verify users list response format', async () => {
    const res = await usersAPI.getAll(token);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test('verify users are sorted by latest id', async () => {
    const res = await usersAPI.getAll(token);
    const ids = res.body.data.map(u => u.id);
    const sortedDesc = [...ids].sort((a, b) => b - a);
    expect(ids).toEqual(sortedDesc);
  });

  test('verify inactive users are not returned', async () => {
    const res = await usersAPI.getAll(token);
    const hasInactive = res.body.data.some(u => u.status === 'inactive');
    expect(hasInactive).toBe(false);
  });

  test('verify success message for users list API', async () => {
    const res = await usersAPI.getAll(token);
    expect(res.body).toHaveProperty('message');
    expect(typeof res.body.message).toBe('string');
  });

  // Internal server error handling – placeholder (cannot reliably trigger DB error)
  test.skip('verify internal server error handling during user creation', async () => {
    // This test is skipped because simulating a DB failure requires mocking the DB layer.
  });
});
