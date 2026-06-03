const { apiRequest } = require("../helpers/api.helpers");
const { ROUTES } = require("../constants/routes");

class UsersAPI {
  create(body, token) {
    return apiRequest("POST", ROUTES.users, body, token);
  }

  getAll(token) {
    return apiRequest("GET", ROUTES.users, null, token);
  }
}

module.exports = { UsersAPI };
