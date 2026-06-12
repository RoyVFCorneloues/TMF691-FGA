/**
 * =============================================================================
 * DATA SOURCE FACTORY
 * -----------------------------------------------------------------------------
 * Selects and returns the appropriate DataSourceProvider implementation
 * based on the DATA_PROVIDER environment variable.
 *
 * Supported providers:
 *   json (default) → JsonFileProvider  (local JSON files)
 *
 * Usage:
 *   const dataProvider = require('./src/data');
 *   dataProvider.init();
 *   const sub = dataProvider.findSubscriptionById('S1');
 *
 * To add a new provider:
 *   1. Create src/data/myProvider.js that extends DataSourceProvider
 *   2. Add a case below (e.g. 'tmf_api')
 *   3. Set DATA_PROVIDER=tmf_api in your environment
 *
 * =============================================================================
 */

const JsonFileProvider = require('./jsonFileProvider');

/**
 * ============================================================================
 * CREATE DATA PROVIDER
 * ----------------------------------------------------------------------------
 * Instantiates and returns the correct provider for the current configuration.
 *
 * @param {string} [providerName] - Override (defaults to DATA_PROVIDER env var)
 *
 * Returns:
 *   DataSourceProvider instance
 * ============================================================================
 */
function createDataProvider(providerName) {
  const name = (providerName || process.env.DATA_PROVIDER || 'json').toLowerCase();

  switch (name) {
    case 'json':
      return new JsonFileProvider();

    default:
      throw new Error(
        `Unknown DATA_PROVIDER: "${name}". Supported values: json`
      );
  }
}

// Export a singleton instance for convenience (most callers just require this)
const defaultProvider = createDataProvider();

module.exports = defaultProvider;
module.exports.createDataProvider = createDataProvider;
