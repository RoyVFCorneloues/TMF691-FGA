/**
 * =============================================================================
 * SUBSCRIPTION REPOSITORY
 * -----------------------------------------------------------------------------
 * Abstracts access to subscription data.
 *
 * CURRENT IMPLEMENTATION:
 *   - Loads subscriptions from local JSON file (PoC mode)
 *
 * FUTURE IMPLEMENTATION:
 *   - Replace internal lookup with TMF Product / Service / Inventory APIs
 *   - Maintain same interface (no changes required upstream)
 *
 * RESPONSIBILITIES:
 *   - Load subscription data into memory
 *   - Provide lookup methods
 *   - Support runtime reload without server restart
 *
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');

// In-memory cache
let subscriptions = [];

/**
 * ============================================================================
 * LOAD SUBSCRIPTIONS
 * ----------------------------------------------------------------------------
 * Loads subscriptions from subscriptions.json into memory.
 *
 * Returns:
 *   void (updates internal subscriptions array)
 * ============================================================================
 */
function loadSubscriptions() {
  try {
    const filePath = path.join(__dirname, '../data/subscriptions.json');

    const data = fs.readFileSync(filePath, 'utf-8');
    subscriptions = JSON.parse(data);

    console.log(`✅ Subscriptions loaded (${subscriptions.length} records)`);

  } catch (err) {
    console.error('❌ Failed to load subscriptions:', err.message);
  }
}

/**
 * ============================================================================
 * RELOAD SUBSCRIPTIONS
 * ----------------------------------------------------------------------------
 * Explicit reload wrapper (for API-triggered refresh).
 *
 * Returns:
 *   Number of subscription records currently loaded
 * ============================================================================
 */
function reloadSubscriptions() {
  loadSubscriptions();
  return subscriptions.length;
}

/**
 * ============================================================================
 * FIND SUBSCRIPTION BY ID
 * ----------------------------------------------------------------------------
 * Retrieves a single subscription record by ID.
 *
 * @param {string} id - Subscription identifier (e.g. "S1")
 *
 * Returns:
 *   Subscription object or undefined
 * ============================================================================
 */
function findById(id) {
  return subscriptions.find(s => s.id === id);
}

/**
 * ============================================================================
 * FIND SUBSCRIPTIONS BY ACCOUNT ID
 * ----------------------------------------------------------------------------
 * Retrieves all subscriptions associated with an account.
 *
 * @param {string} accountId - Account identifier (e.g. "A1")
 *
 * Returns:
 *   Array of subscription objects
 * ============================================================================
 */
function findByAccountId(accountId) {
  return subscriptions.filter(s => s.accountId === accountId);
}

/**
 * ============================================================================
 * GET ALL SUBSCRIPTIONS
 * ----------------------------------------------------------------------------
 * Returns full dataset (for debugging/demo only).
 *
 * Returns:
 *   Array of subscriptions
 * ============================================================================
 */
function getAll() {
  return subscriptions;
}

/**
 * ============================================================================
 * OPTIONAL: WATCH FILE FOR AUTO-RELOAD
 * ----------------------------------------------------------------------------
 * Automatically reloads when subscriptions.json is updated.
 *
 * (Enabled by default for PoC convenience)
 * ============================================================================
 */
function watchFile() {
  const filePath = path.join(__dirname, '../data/subscriptions.json');

  fs.watchFile(filePath, () => {
    console.log('🔄 subscriptions.json changed, reloading...');
    loadSubscriptions();
  });
}

/**
 * ============================================================================
 * INITIALISE REPOSITORY
 * ----------------------------------------------------------------------------
 * Called once at app startup.
 * Loads the current dataset and enables file watching.
 *
 * Returns:
 *   void
 * ============================================================================
 */
function init() {
  loadSubscriptions();
  watchFile(); // comment out if you prefer manual reload only
}

module.exports = {
  init,
  reloadSubscriptions,
  findById,
  findByAccountId,
  getAll
};
