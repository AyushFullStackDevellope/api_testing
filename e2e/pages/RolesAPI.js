const { getApp } = require("../helpers/api.helpers");
const { ROUTES } = require("../constants/routes");

class RolesAPI {
  create(body, token) {
    return getApp()
      .post(ROUTES.roles)
      .send(body)
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${token}`);
  }

  getAll(token) {
    return getApp()
      .get(ROUTES.roles)
      .set("Authorization", `Bearer ${token}`);
  }
}

module.exports = { RolesAPI };
