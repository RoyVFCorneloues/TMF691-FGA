/**
 * =============================================================================
 * AUTHORIZATION PROVIDER INTERFACE
 * -----------------------------------------------------------------------------
 * Defines the contract that every authorization provider must implement.
 * Concrete implementations (e.g. Auth0FgaProvider) extend this class and
 * override the abstract methods below.
 *
 * METHODS:
 *   listUserObjects(userId, relation, type)  – objects a user can access
 *   readTuple(tuple)                         – read matching tuples
 *   writeTupleBatch({ writes, deletes })     – apply tuple writes/deletes
 *
 * =============================================================================
 */

class AuthorizationProvider {
  /**
   * ============================================================================
   * LIST USER OBJECTS
   * ----------------------------------------------------------------------------
   * Retrieves all objects of a given type that a user has the specified
   * relation to.
   *
   * @param {string} userId   - User identifier (e.g. "mr-b")
   * @param {string} relation - Relation (e.g. "can_view")
   * @param {string} type     - Object type (e.g. "subscription")
   *
   * Returns:
   *   Promise<string[]>  Array of object identifiers
   *                      (e.g. ["subscription:S1", "subscription:S2"])
   * ============================================================================
   */
  // eslint-disable-next-line no-unused-vars
  async listUserObjects(userId, relation, type) {
    throw new Error('listUserObjects() must be implemented by the provider');
  }

  /**
   * ============================================================================
   * READ TUPLE
   * ----------------------------------------------------------------------------
   * Reads tuples from the authorization store matching the provided key.
   *
   * @param {{ user: string, relation: string, object: string }} tuple
   *
   * Returns:
   *   Promise<Object[]>  Array of matching tuple objects
   * ============================================================================
   */
  // eslint-disable-next-line no-unused-vars
  async readTuple(tuple) {
    throw new Error('readTuple() must be implemented by the provider');
  }

  /**
   * ============================================================================
   * WRITE TUPLE BATCH
   * ----------------------------------------------------------------------------
   * Applies a batch of tuple writes and/or deletes to the authorization store.
   *
   * @param {Object}   params
   * @param {Object[]} params.writes  - Tuples to add
   * @param {Object[]} params.deletes - Tuples to remove
   *
   * Returns:
   *   Promise<Object>  Raw API response from the authorization store
   * ============================================================================
   */
  // eslint-disable-next-line no-unused-vars
  async writeTupleBatch({ writes, deletes } = {}) {
    throw new Error('writeTupleBatch() must be implemented by the provider');
  }
}

module.exports = AuthorizationProvider;
