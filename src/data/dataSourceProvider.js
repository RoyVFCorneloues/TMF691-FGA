/**
 * =============================================================================
 * DATA SOURCE PROVIDER INTERFACE (PIP)
 * -----------------------------------------------------------------------------
 * Defines the contract that every data-source (Policy Information Point)
 * provider must implement.  Concrete implementations (e.g. JsonFileProvider)
 * extend this class and override the abstract methods below.
 *
 * SUBSCRIPTION METHODS:
 *   init()                                    – initialise all data sources
 *   findSubscriptionById(id)                  – lookup by subscription ID
 *   findSubscriptionsByAccountId(accountId)   – all subscriptions for account
 *   getAllSubscriptions()                      – full dataset
 *   reloadSubscriptions()                     – reload, returns record count
 *
 * CUSTOMER METHODS:
 *   findCustomerById(id)                      – lookup by customer ID
 *   getAllCustomers()                          – full dataset
 *   reloadCustomers()                         – reload, returns record count
 *
 * TMF DATA METHODS:
 *   getTmfAccounts()                          – TMF account records
 *   getTmfSubscriptions()                     – TMF subscription records
 *   getTmfRoles()                             – TMF party-role records
 *
 * =============================================================================
 */

class DataSourceProvider {
  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * ============================================================================
   * INIT
   * ----------------------------------------------------------------------------
   * Initialises all data sources (load data, set up watchers, etc.).
   * Called once at application startup.
   *
   * Returns:
   *   void | Promise<void>
   * ============================================================================
   */
  init() {
    throw new Error('init() must be implemented by the provider');
  }

  // ---------------------------------------------------------------------------
  // Subscription methods
  // ---------------------------------------------------------------------------

  /**
   * ============================================================================
   * FIND SUBSCRIPTION BY ID
   * ----------------------------------------------------------------------------
   * Retrieves a single subscription by its identifier.
   *
   * @param {string} id  Subscription identifier (e.g. "S1")
   *
   * Returns:
   *   Subscription object | undefined | Promise<Subscription | undefined>
   * ============================================================================
   */
  // eslint-disable-next-line no-unused-vars
  findSubscriptionById(id) {
    throw new Error('findSubscriptionById() must be implemented by the provider');
  }

  /**
   * ============================================================================
   * FIND SUBSCRIPTIONS BY ACCOUNT ID
   * ----------------------------------------------------------------------------
   * Retrieves all subscriptions associated with an account.
   *
   * @param {string} accountId  Account identifier (e.g. "A1")
   *
   * Returns:
   *   Subscription[] | Promise<Subscription[]>
   * ============================================================================
   */
  // eslint-disable-next-line no-unused-vars
  findSubscriptionsByAccountId(accountId) {
    throw new Error('findSubscriptionsByAccountId() must be implemented by the provider');
  }

  /**
   * ============================================================================
   * GET ALL SUBSCRIPTIONS
   * ----------------------------------------------------------------------------
   * Returns the full subscription dataset.
   *
   * Returns:
   *   Subscription[] | Promise<Subscription[]>
   * ============================================================================
   */
  getAllSubscriptions() {
    throw new Error('getAllSubscriptions() must be implemented by the provider');
  }

  /**
   * ============================================================================
   * RELOAD SUBSCRIPTIONS
   * ----------------------------------------------------------------------------
   * Forces a reload of subscription data.
   *
   * Returns:
   *   number | Promise<number>  Count of loaded records
   * ============================================================================
   */
  reloadSubscriptions() {
    throw new Error('reloadSubscriptions() must be implemented by the provider');
  }

  // ---------------------------------------------------------------------------
  // Customer methods
  // ---------------------------------------------------------------------------

  /**
   * ============================================================================
   * FIND CUSTOMER BY ID
   * ----------------------------------------------------------------------------
   * Retrieves a single customer/party record by its identifier.
   *
   * @param {string} id  Customer identifier (e.g. "mr-b")
   *
   * Returns:
   *   Customer object | undefined | Promise<Customer | undefined>
   * ============================================================================
   */
  // eslint-disable-next-line no-unused-vars
  findCustomerById(id) {
    throw new Error('findCustomerById() must be implemented by the provider');
  }

  /**
   * ============================================================================
   * GET ALL CUSTOMERS
   * ----------------------------------------------------------------------------
   * Returns the full customer dataset.
   *
   * Returns:
   *   Customer[] | Promise<Customer[]>
   * ============================================================================
   */
  getAllCustomers() {
    throw new Error('getAllCustomers() must be implemented by the provider');
  }

  /**
   * ============================================================================
   * RELOAD CUSTOMERS
   * ----------------------------------------------------------------------------
   * Forces a reload of customer data.
   *
   * Returns:
   *   number | Promise<number>  Count of loaded records
   * ============================================================================
   */
  reloadCustomers() {
    throw new Error('reloadCustomers() must be implemented by the provider');
  }

  // ---------------------------------------------------------------------------
  // TMF data methods
  // ---------------------------------------------------------------------------

  /**
   * ============================================================================
   * GET TMF ACCOUNTS
   * ----------------------------------------------------------------------------
   * Returns TMF account records.
   *
   * Returns:
   *   Object[] | Promise<Object[]>
   * ============================================================================
   */
  getTmfAccounts() {
    throw new Error('getTmfAccounts() must be implemented by the provider');
  }

  /**
   * ============================================================================
   * GET TMF SUBSCRIPTIONS
   * ----------------------------------------------------------------------------
   * Returns TMF subscription records.
   *
   * Returns:
   *   Object[] | Promise<Object[]>
   * ============================================================================
   */
  getTmfSubscriptions() {
    throw new Error('getTmfSubscriptions() must be implemented by the provider');
  }

  /**
   * ============================================================================
   * GET TMF ROLES
   * ----------------------------------------------------------------------------
   * Returns TMF party-role records.
   *
   * Returns:
   *   Object[] | Promise<Object[]>
   * ============================================================================
   */
  getTmfRoles() {
    throw new Error('getTmfRoles() must be implemented by the provider');
  }
}

module.exports = DataSourceProvider;
