// e2e/tests/jwt.test.js
/**
 * Unit tests for JWT utility functions located in src/utils/jwt.js
 * Scenarios:
 * 1. generatePreContextToken – verifies a token is created.
 * 2. generateAccessToken – verifies a token is created.
 * 3. verifyToken middleware – valid token passes through.
 * 4. verifyToken middleware – missing Authorization header returns 401.
 * 5. verifyToken middleware – malformed token returns 401.
 * 6. verifyToken middleware – expired token returns 401.
 * 7. Payload contains user_id (both token types).
 * 8. Payload contains email (pre‑context token only).
 */

const jwt = require('jsonwebtoken');
const { generatePreContextToken, generateAccessToken, verifyToken } = require('../../src/utils/jwt');

// -----------------------------------------------------------------------------
// Helper to mock Express req/res/next
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('JWT Service Unit Tests', () => {
    const secret = process.env.JWT_SECRET || 'test-secret';
    const originalEnv = process.env.JWT_SECRET;

    beforeAll(() => {
        // Ensure the library uses our test secret
        process.env.JWT_SECRET = secret;
    });

    afterAll(() => {
        process.env.JWT_SECRET = originalEnv;
    });

    // -------------------------------------------------------------------------
    // Token generation
    // -------------------------------------------------------------------------
    test('generatePreContextToken creates a valid JWT', () => {
        const payload = { user_id: 42, email: 'user@example.com' };
        const token = generatePreContextToken(payload);
        expect(typeof token).toBe('string');

        // Verify it can be decoded and contains the expected fields
        const decoded = jwt.verify(token, secret);
        expect(decoded).toMatchObject({
            user_id: payload.user_id,
            email: payload.email,
            token_type: 'pre_context',
        });
    });

    test('generateAccessToken creates a valid JWT', () => {
        const payload = {
            user_id: 99,
            tenant_id: 1,
            institute_id: 2,
            role_id: 3,
        };
        const token = generateAccessToken(payload);
        expect(typeof token).toBe('string');

        const decoded = jwt.verify(token, secret);
        expect(decoded).toMatchObject({
            user_id: payload.user_id,
            tenant_id: payload.tenant_id,
            institute_id: payload.institute_id,
            role_id: payload.role_id,
            token_type: 'access',
        });
    });

    // -------------------------------------------------------------------------
    // verifyToken middleware – happy path
    // -------------------------------------------------------------------------
    test('verifyToken passes a valid token to next()', async () => {
        const payload = { user_id: 7, email: 'a@b.c' };
        const token = generatePreContextToken(payload);
        const req = {
            headers: { authorization: `Bearer ${token}` },
        };
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

    // -------------------------------------------------------------------------
    // verifyToken – error handling
    // -------------------------------------------------------------------------
    test('verifyToken returns 401 when Authorization header is missing', async () => {
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

    test('verifyToken returns 401 when token is not provided', async () => {
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

    test('verifyToken returns 401 for an invalid token', async () => {
        const req = { headers: { authorization: 'Bearer invalid.jwt.token' } };
        const res = mockResponse();
        const next = jest.fn();

        await verifyToken(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Invalid or expired token' })
        );
        expect(next).not.toHaveBeenCalled();
    });

    test('verifyToken returns 401 for an expired token', async () => {
        // Create a token that expires immediately
        const expired = jwt.sign(
            { user_id: 1, token_type: 'pre_context' },
            secret,
            { expiresIn: '1ms' }
        );
        // Wait a tick so it is definitely expired
        await new Promise((r) => setTimeout(r, 10));

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

    // -------------------------------------------------------------------------
    // Payload content checks (already covered by generate* tests, but repeat for clarity)
    // -------------------------------------------------------------------------
    test('generated pre‑context token contains user_id and email', () => {
        const payload = { user_id: 123, email: 'test@domain.com' };
        const token = generatePreContextToken(payload);
        const decoded = jwt.verify(token, secret);
        expect(decoded.user_id).toBe(payload.user_id);
        expect(decoded.email).toBe(payload.email);
    });

    test('generated access token contains user_id and role info', () => {
        const payload = {
            user_id: 5,
            tenant_id: 10,
            institute_id: 20,
            role_id: 30,
        };
        const token = generateAccessToken(payload);
        const decoded = jwt.verify(token, secret);
        expect(decoded.user_id).toBe(payload.user_id);
        expect(decoded.tenant_id).toBe(payload.tenant_id);
        expect(decoded.institute_id).toBe(payload.institute_id);
        expect(decoded.role_id).toBe(payload.role_id);
    });
});
