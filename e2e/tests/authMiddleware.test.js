// e2e/tests/authMiddleware.test.js
/**
 * Unit tests for the authentication middleware (verifyToken) exported from src/utils/jwt.js
 * Scenarios:
 * 1. Verify middleware with a valid token – should call next() and attach decoded user.
 * 2. Verify middleware without token – should return 401 with 'Missing Authorization header'.
 * 3. Verify middleware with an invalid token – should return 401 with 'Invalid or expired token'.
 * 4. Verify decoded user data is attached to req (user_id, email, token_type).
 * 5. Verify Bearer token parsing – token is extracted correctly from "Bearer <token>".
 */

const jwt = require('jsonwebtoken');
const { generatePreContextToken, verifyToken } = require('../../src/utils/jwt');

// Helper to mock Express req/res/next
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Auth Middleware (verifyToken) Unit Tests', () => {
  const secret = process.env.JWT_SECRET || 'test-secret';
  const originalEnv = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = secret;
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalEnv;
  });

  test('valid token – calls next() and attaches decoded user', async () => {
    const payload = { user_id: 101, email: 'tester@example.com' };
    const token = generatePreContextToken(payload);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockResponse();
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req).toHaveProperty('user');
    expect(req.user).toMatchObject({
      user_id: payload.user_id,
      email: payload.email,
      token_type: 'pre_context',
    });
  });

  test('missing Authorization header – returns 401', async () => {
    const req = { headers: {} };
    const res = mockResponse();
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Missing Authorization header' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('empty token after Bearer – returns 401', async () => {
    const req = { headers: { authorization: 'Bearer' } };
    const res = mockResponse();
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Token not provided' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('invalid token – returns 401', async () => {
    const req = { headers: { authorization: 'Bearer not.a.valid.token' } };
    const res = mockResponse();
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid or expired token' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('expired token – returns 401', async () => {
    const expired = jwt.sign({ user_id: 1, token_type: 'pre_context' }, secret, { expiresIn: '1ms' });
    // ensure token is expired
    await new Promise(r => setTimeout(r, 10));
    const req = { headers: { authorization: `Bearer ${expired}` } };
    const res = mockResponse();
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid or expired token' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('Bearer parsing – token is correctly extracted from header', async () => {
    const payload = { user_id: 55, email: 'parse@test.com' };
    const token = generatePreContextToken(payload);
    const req = { headers: { authorization: `Bearer    ${token}` } }; // extra spaces
    const res = mockResponse();
    const next = jest.fn();

    await verifyToken(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toHaveProperty('user_id', payload.user_id);
  });
});
