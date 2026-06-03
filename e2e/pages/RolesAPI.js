const { apiRequest } = require("../helpers/api.helpers");
const { ROUTES } = require("../constants/routes");

class RolesAPI {
  create(body, token) {
    return apiRequest("POST", ROUTES.roles, body, token);
  }

  getAll(token) {
    return apiRequest("GET", ROUTES.roles, null, token);
  }
}

module.exports = { RolesAPI };
