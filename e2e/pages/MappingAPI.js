const { getApp } = require("../helpers/api.helpers");
const { ROUTES } = require("../constants/routes");

class MappingAPI {
  /**
   * Create a new mapping
   * @param {Object} body - mapping payload
   * @param {string} token - auth token
   */
  create(body, token) {
    return getApp()
      .post(ROUTES.mapping)
      .send(body)
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${token}`);
  }

  /**
   * Get all mappings, optionally filtered by user_id
   */
  getAll(token, filter = {}) {
    const query = new URLSearchParams(filter).toString();
    const endpoint = query ? `${ROUTES.mapping}?${query}` : ROUTES.mapping;
    return getApp()
      .get(endpoint)
      .set("Authorization", `Bearer ${token}`);
  }
}

module.exports = { MappingAPI };
