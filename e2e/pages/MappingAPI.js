const { apiRequest } = require("../helpers/api.helpers");
const { ROUTES } = require("../constants/routes");

class MappingAPI {
  create(body, token) {
    return apiRequest("POST", ROUTES.mapping, body, token);
  }

  getAll(token, filter = {}) {
    return apiRequest("GET", ROUTES.mapping, null, token, filter);
  }
}

module.exports = { MappingAPI };
