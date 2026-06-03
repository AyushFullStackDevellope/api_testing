const { getApp } = require("./api.helpers");

const createTestTenant = async (token) => {
  const suffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const code = `TENANT_${suffix}`;
  const res = await getApp()
    .post("/tenants")
    .send({ name: `Test Tenant ${suffix}`, code })
    .set("Authorization", `Bearer ${token}`);
  return res.body.data;
};

const createTestInstitute = async (tenantId, token) => {
  const suffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const code = `INST_${suffix}`;
  const res = await getApp()
    .post("/institutes")
    .send({
      tenant_id: tenantId,
      name: `Test Institute ${suffix}`,
      code,
      type: "school",
    })
    .set("Authorization", `Bearer ${token}`);
  return res.body.data;
};

const createTestUser = async (token) => {
  const suffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const email = `user_${suffix}@example.com`;
  const res = await getApp()
    .post("/users")
    .send({
      first_name: "Test",
      last_name: "User",
      email,
      password: "Password123",
    })
    .set("Authorization", `Bearer ${token}`);
  return res.body.data;
};

const createTestRole = async (token) => {
  const suffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const code = `ROLE_${suffix}`;
  const res = await getApp()
    .post("/roles")
    .send({ name: `Test Role ${suffix}`, code })
    .set("Authorization", `Bearer ${token}`);
  return res.body.data;
};

const getDynamicSetupData = async (token) => {
  const tenant = await createTestTenant(token);
  const institute = await createTestInstitute(tenant.id, token);
  const user = await createTestUser(token);
  const role = await createTestRole(token);
  return {
    tenant,
    institute,
    user,
    role,
    tenant_id: tenant.id,
    institute_id: institute.id,
    user_id: user.id,
    role_id: role.id,
  };
};

module.exports = {
  createTestTenant,
  createTestInstitute,
  createTestUser,
  createTestRole,
  getDynamicSetupData,
};
