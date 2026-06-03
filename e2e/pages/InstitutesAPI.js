const { apiRequest } = require("../helpers/api.helpers");
const { ROUTES } = require("../constants/routes");

class InstitutesAPI {
  create(body, token) {
    return apiRequest("POST", ROUTES.institutes, body, token);
  }

  getAll(token) {
    return apiRequest("GET", ROUTES.institutes, null, token);
  }
}

module.exports = { InstitutesAPI };
