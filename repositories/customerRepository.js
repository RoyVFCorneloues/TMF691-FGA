/**
 * =============================================================================
 * CUSTOMER REPOSITORY
 * -----------------------------------------------------------------------------
 * Abstracts access to customer data.
 *
 * CURRENT IMPLEMENTATION:
 *   - Loads customers from local JSON file (PoC mode)
 *
 * FUTURE IMPLEMENTATION:
 *   - Replace internal lookup with TMF Party / Customer APIs
 *   - Maintain same interface (no changes required upstream)
 *
 * RESPONSIBILITIES:
 *   - Load customer data into memory
 *   - Provide lookup methods
 *   - Support runtime reload without server restart
 *
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');

// In-memory cache
let customers = [];

/**
 * ============================================================================
 * LOAD CUSTOMERS
 * ----------------------------------------------------------------------------
 * Loads customers from customers.json into memory
 *
 * Returns:
 *   void (updates internal customers array)
 * ============================================================================
 */
function loadCustomers() {
  try {
    const filePath = path.join(__dirname, '../data/customers.json');

    const data = fs.readFileSync(filePath, 'utf-8');
    customers = JSON.parse(data);

    console.log(`✅ Customers loaded (${customers.length} records)`);

  } catch (err) {
    console.error("❌ Failed to load customers:", err.message);
  }
}

/**
 * ============================================================================
 * RELOAD CUSTOMERS
 * ----------------------------------------------------------------------------
 * Explicit reload wrapper (for API-triggered refresh)
 *
 * Returns:
 *   Updated customer count
 * ============================================================================
 */
function reloadCustomers() {
  loadCustomers();
  return customers.length;
}

/**
 * ============================================================================
 * FIND CUSTOMER BY ID
 * ----------------------------------------------------------------------------
 * Retrieves a single customer record
 *
 * @param {string} id - Customer identifier (e.g. "mr-b")
 *
 * Returns:
 *   Customer object or undefined
 * ============================================================================
 */
function findById(id) {
  return customers.find(c => c.id === id);
}

/**
 * ============================================================================
 * GET ALL CUSTOMERS
 * ----------------------------------------------------------------------------
 * Returns full dataset (for debugging/demo only)
 *
 * Returns:
 *   Array of customers
 * ============================================================================
 */
function getAll() {
  return customers;
}

/**
 * ============================================================================
 * OPTIONAL: WATCH FILE FOR AUTO-RELOAD
 * ----------------------------------------------------------------------------
 * Automatically reloads when customers.json is updated
 *
 * (Enabled by default for PoC convenience)
 * ============================================================================
 */
function watchFile() {
  const filePath = path.join(__dirname, '../data/customers.json');

  fs.watchFile(filePath, () => {
    console.log("🔄 customers.json changed, reloading...");
    loadCustomers();
  });
}

/**
 * ============================================================================
 * INITIALISE REPOSITORY
 * ----------------------------------------------------------------------------
 * Called once at app startup
 * ============================================================================
 */
function init() {
  loadCustomers();
  watchFile(); // comment out if you prefer manual reload only
}

module.exports = {
  init,
  reloadCustomers,
  findById,
  getAll
};
