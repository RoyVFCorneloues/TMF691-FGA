/**
 * =============================================================================
 * AUTHORIZATION FACTORY
 * -----------------------------------------------------------------------------
 * Selects and returns the appropriate AuthorizationProvider implementation
 * based on the AUTH_PROVIDER environment variable.
 *
 * Supported providers:
 *   auth0 (default) → Auth0FgaProvider
 *
 * Usage:
 *   const authProvider = require('./src/authorization');
 *   const objects = await authProvider.listUserObjects(userId, relation, type);
 *
 * =============================================================================
 */

const Auth0FgaProvider = require('./auth0FgaProvider');

/**
 * ============================================================================
 * CREATE PROVIDER
 * ----------------------------------------------------------------------------
 * Instantiates and returns the correct provider for the current configuration.
 *
 * @param {string} [providerName] - Override (defaults to AUTH_PROVIDER env var)
 *
 * Returns:
 *   AuthorizationProvider instance
 * ============================================================================
 */
function createProvider(providerName) {
  const name = (providerName || process.env.AUTH_PROVIDER || 'auth0').toLowerCase();

  switch (name) {
    case 'auth0':
      return new Auth0FgaProvider();

    default:
      throw new Error(
        `Unknown AUTH_PROVIDER: "${name}". Supported values: auth0`
      );
  }
}

// Export a singleton instance for convenience (most callers just require this)
const defaultProvider = createProvider();

module.exports = defaultProvider;
module.exports.createProvider = createProvider;
