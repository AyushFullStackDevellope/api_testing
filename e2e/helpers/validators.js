const validateJSONHeaders = (res, expectedStatus) => {
  expect(res.status).toBe(expectedStatus);
  expect(res.headers["content-type"]).toMatch(/application\/json/);
};

const validateSuccessResponse = (res, expectedStatus = 200) => {
  validateJSONHeaders(res, expectedStatus);
  expect(res.body).toHaveProperty("success", true);
  expect(res.body).toHaveProperty("message");
  expect(typeof res.body.message).toBe("string");
  expect(res.body).toHaveProperty("data");
  return res.body.data;
};

const validateListResponse = (res, expectedStatus = 200) => {
  validateJSONHeaders(res, expectedStatus);
  expect(res.body).toHaveProperty("success", true);
  expect(res.body).toHaveProperty("message");
  expect(typeof res.body.message).toBe("string");
  expect(res.body).toHaveProperty("data");
  expect(Array.isArray(res.body.data)).toBe(true);
  return res.body.data;
};

const validateErrorResponse = (res, expectedStatus) => {
  validateJSONHeaders(res, expectedStatus);
  expect(res.body).toHaveProperty("success", false);
  expect(res.body).toHaveProperty("message");
  expect(typeof res.body.message).toBe("string");
};

module.exports = {
  validateJSONHeaders,
  validateSuccessResponse,
  validateListResponse,
  validateErrorResponse,
};
