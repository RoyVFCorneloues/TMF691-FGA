/**
 * =============================================================================
 * JSON FILE PROVIDER (PIP)
 * -----------------------------------------------------------------------------
 * Implements DataSourceProvider using the local JSON-file-backed repositories.
 * This is the default provider used when DATA_PROVIDER=json (or unset).
 *
 * Delegates all data access to the existing repository modules so that
 * behaviour is identical to the previous direct-import approach.
 *
 * =============================================================================
 */

const DataSourceProvider = require('./dataSourceProvider');
const subscriptionRepository = require('../repositories/subscriptionRepository');
const customerRepository = require('../repositories/customerRepository');
const tmfRepository = require('../repositories/tmfRepository');

class JsonFileProvider extends DataSourceProvider {
  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Initialises all JSON-backed repositories (loads files, starts watchers).
   */
  init() {
    subscriptionRepository.init();
    customerRepository.init();
    tmfRepository.load();
  }

  // ---------------------------------------------------------------------------
  // Subscription methods
  // ---------------------------------------------------------------------------

  findSubscriptionById(id) {
    return subscriptionRepository.findById(id);
  }

  findSubscriptionsByAccountId(accountId) {
    return subscriptionRepository.findByAccountId(accountId);
  }

  getAllSubscriptions() {
    return subscriptionRepository.getAll();
  }

  reloadSubscriptions() {
    return subscriptionRepository.reloadSubscriptions();
  }

  // ---------------------------------------------------------------------------
  // Customer methods
  // ---------------------------------------------------------------------------

  findCustomerById(id) {
    return customerRepository.findById(id);
  }

  getAllCustomers() {
    return customerRepository.getAll();
  }

  reloadCustomers() {
    return customerRepository.reloadCustomers();
  }

  // ---------------------------------------------------------------------------
  // TMF data methods
  // ---------------------------------------------------------------------------

  getTmfAccounts() {
    return tmfRepository.getAccounts();
  }

  getTmfSubscriptions() {
    return tmfRepository.getSubscriptions();
  }

  getTmfRoles() {
    return tmfRepository.getRoles();
  }
}

module.exports = JsonFileProvider;
