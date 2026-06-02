/**
 * =============================================================================
 * FGA CLIENT
 * -----------------------------------------------------------------------------
 * Encapsulates all communication with Auth0 Fine Grained Authorization (FGA).
 *
 * RESPONSIBILITIES:
 *   - Obtain OAuth access tokens
 *   - Call FGA APIs (ListObjects)
 *   - Hide API complexity from service layer
 *
 * FUTURE EXTENSIONS:
 *   - Check
 *   - Write relationships
 *   - Batch operations
 *
 * =============================================================================
 */

const axios = require('axios');

let accessToken = null;
let tokenExpiry = null;

/**
 * ============================================================================
 * GET ACCESS TOKEN
 * ----------------------------------------------------------------------------
 * Retrieves and caches an OAuth token for FGA API calls.
 *
 * Returns:
 *   String access token
 * ============================================================================
 */
async function getToken() {
  // ✅ Reuse token if still valid
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await axios.post(
      'https://auth.fga.dev/oauth/token',
      {
        client_id: process.env.FGA_CLIENT_ID,
        client_secret: process.env.FGA_CLIENT_SECRET,
        audience: "https://api.eu1.fga.dev/",
        grant_type: "client_credentials"
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    accessToken = response.data.access_token;

    // ✅ Cache expiry (typically ~1 hour)
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 5000;

    console.log("✅ FGA token acquired");

    return accessToken;

  } catch (err) {
    console.error("❌ Failed to get FGA token:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * ============================================================================
 * LIST OBJECTS
 * ----------------------------------------------------------------------------
 * Calls FGA ListObjects endpoint to retrieve resources a user can access.
 *
 * @param {string} userId - User identifier (e.g. "mr-b")
 * @param {string} relation - Relation (e.g. "can_view")
 * @param {string} type - Object type (e.g. "subscription")
 *
 * Returns:
 *   Array of object IDs (e.g. ["subscription:S1", "subscription:S2"])
 * ============================================================================
 */
async function listObjects(userId, relation, type) {
  try {
    const token = await getToken();

    const response = await axios.post(
      `${process.env.FGA_API_URL}/stores/${process.env.FGA_STORE_ID}/list-objects`,
      {
        user: `user:${userId}`,
        relation: relation,
        type: type,
        authorization_model_id: process.env.FGA_MODEL_ID
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.objects;

  } catch (err) {
    console.error("❌ FGA ListObjects error:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * ============================================================================
 * GET USER SUBSCRIPTIONS
 * ----------------------------------------------------------------------------
 * Convenience method to retrieve subscriptions a user can view.
 *
 * @param {string} userId
 *
 * Returns:
 *   Array of subscription object references
 * ============================================================================
 */
async function getUserSubscriptions(userId) {
  return listObjects(userId, "can_view", "subscription");
}

module.exports = {
  getUserSubscriptions,
  listObjects
};
