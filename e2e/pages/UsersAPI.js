const { getApp } = require("../helpers/api.helpers");
const { ROUTES } = require("../constants/routes");

class UsersAPI {
  create(body, token) {
    return getApp()
      .post(ROUTES.users)
      .send(body)
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${token}`);
  }

  getAll(token) {
    return getApp()
      .get(ROUTES.users)
      .set("Authorization", `Bearer ${token}`);
  }
}

module.exports = { UsersAPI };
