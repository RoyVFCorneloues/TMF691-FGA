/**
 * =============================================================================
 * AUTH0 FGA PROVIDER
 * -----------------------------------------------------------------------------
 * Implements AuthorizationProvider using Auth0 Fine Grained Authorization.
 *
 * RESPONSIBILITIES:
 *   - Obtain and cache OAuth access tokens
 *   - Query FGA (listUserObjects / readTuple)
 *   - Apply tuple mutations (writeTupleBatch)
 *
 * NOTES:
 *   - FGA exposes tuple mutation via the /write endpoint
 *   - Tuple changes are modelled as explicit write + delete operations
 *   - There is no direct tuple "update" operation in this implementation
 *
 * =============================================================================
 */

const axios = require('axios');
const AuthorizationProvider = require('./authorizationProvider');

class Auth0FgaProvider extends AuthorizationProvider {
  constructor() {
    super();
    this._accessToken = null;
    this._tokenExpiry = null;
  }

  /**
   * ============================================================================
   * GET ACCESS TOKEN
   * ----------------------------------------------------------------------------
   * Retrieves and caches an OAuth token for FGA API calls.
   *
   * Returns:
   *   Promise<string>  Access token
   * ============================================================================
   */
  async _getToken() {
    if (this._accessToken && this._tokenExpiry && Date.now() < this._tokenExpiry) {
      return this._accessToken;
    }

    try {
      const response = await axios.post(
        'https://auth.fga.dev/oauth/token',
        {
          client_id: process.env.FGA_CLIENT_ID,
          client_secret: process.env.FGA_CLIENT_SECRET,
          audience: 'https://api.eu1.fga.dev/',
          grant_type: 'client_credentials'
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      this._accessToken = response.data.access_token;
      this._tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 5000;

      console.log('✅ FGA token acquired');
      return this._accessToken;

    } catch (err) {
      console.error('❌ Failed to get FGA token:', err.response?.data || err.message);
      throw err;
    }
  }

  /**
   * ============================================================================
   * LIST USER OBJECTS
   * ----------------------------------------------------------------------------
   * Calls FGA ListObjects endpoint to retrieve resources a user can access.
   *
   * @param {string} userId   - User identifier (e.g. "mr-b")
   * @param {string} relation - Relation (e.g. "can_view")
   * @param {string} type     - Object type (e.g. "subscription")
   *
   * Returns:
   *   Promise<string[]>  Array of object IDs (e.g. ["subscription:S1"])
   * ============================================================================
   */
  async listUserObjects(userId, relation, type) {
    try {
      const token = await this._getToken();

      const response = await axios.post(
        `${process.env.FGA_API_URL}/stores/${process.env.FGA_STORE_ID}/list-objects`,
        {
          user: `user:${userId}`,
          relation,
          type,
          authorization_model_id: process.env.FGA_MODEL_ID
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.objects || [];

    } catch (err) {
      console.error('❌ FGA ListObjects error:', err.response?.data || err.message);
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
   *   Promise<string[]>  Array of subscription object references
   * ============================================================================
   */
  async getUserSubscriptions(userId) {
    return this.listUserObjects(userId, 'can_view', 'subscription');
  }

  /**
   * ============================================================================
   * READ TUPLE
   * ----------------------------------------------------------------------------
   * Reads tuples from FGA matching the provided tuple key.
   *
   * @param {{ user: string, relation: string, object: string }} tuple
   *
   * Returns:
   *   Promise<Object[]>  Array of matching tuples
   * ============================================================================
   */
  async readTuple(tuple) {
    try {
      const token = await this._getToken();

      const response = await axios.post(
        `${process.env.FGA_API_URL}/stores/${process.env.FGA_STORE_ID}/read`,
        {
          tuple_key: {
            user: tuple.user,
            relation: tuple.relation,
            object: tuple.object
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.tuples || [];

    } catch (err) {
      console.error('❌ FGA ReadTuple error:', err.response?.data || err.message);
      throw err;
    }
  }

  /**
   * ============================================================================
   * TUPLE EXISTS
   * ----------------------------------------------------------------------------
   * Checks whether a tuple already exists in FGA.
   *
   * @param {{ user: string, relation: string, object: string }} tuple
   *
   * Returns:
   *   Promise<boolean>
   * ============================================================================
   */
  async tupleExists(tuple) {
    const tuples = await this.readTuple(tuple);

    return tuples.some(t =>
      t.key?.user === tuple.user &&
      t.key?.relation === tuple.relation &&
      t.key?.object === tuple.object
    );
  }

  /**
   * ============================================================================
   * WRITE TUPLE BATCH
   * ----------------------------------------------------------------------------
   * Calls FGA /write to add and/or delete tuples.
   *
   * @param {Object}   params
   * @param {Object[]} params.writes  - Tuples to add
   * @param {Object[]} params.deletes - Tuples to delete
   *
   * Returns:
   *   Promise<Object>  Raw API response
   * ============================================================================
   */
  async writeTupleBatch({ writes = [], deletes = [] } = {}) {
    try {
      const token = await this._getToken();

      const payload = {
        ...(writes.length > 0 && {
          writes: {
            tuple_keys: writes.map(t => ({
              user: t.user,
              relation: t.relation,
              object: t.object
            }))
          }
        }),
        ...(deletes.length > 0 && {
          deletes: {
            tuple_keys: deletes.map(t => ({
              user: t.user,
              relation: t.relation,
              object: t.object
            }))
          }
        }),
        authorization_model_id: process.env.FGA_MODEL_ID
      };

      // 🔍 DEBUG: print payload
      console.log("\n📤 FGA WRITE PAYLOAD:");
      console.log(JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${process.env.FGA_API_URL}/stores/${process.env.FGA_STORE_ID}/write`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;

    } catch (err) {
      console.error('❌ FGA WriteTupleBatch error:', err.response?.data || err.message);
      throw err;
    }
  }
}

module.exports = Auth0FgaProvider;
