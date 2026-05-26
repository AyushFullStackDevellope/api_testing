const { getApp } = require("../helpers/api.helpers");
const { ROUTES } = require("../constants/routes");

class InstitutesAPI {
  create(body, token) {
    return getApp()
      .post(ROUTES.institutes)
      .send(body)
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${token}`);
  }

  getAll(token) {
    return getApp()
      .get(ROUTES.institutes)
      .set("Authorization", `Bearer ${token}`);
  }
}

module.exports = { InstitutesAPI };
