const fgaClient = require('../fga/fgaClient');
const subscriptionRepository = require('../repositories/subscriptionRepository');

/**
 * ============================================================================
 * BUILD USER ASSETS
 * ----------------------------------------------------------------------------
 * Orchestrates:
 *   1. Calls FGA to get authorised subscriptions
 *   2. Enriches using repository
 *   3. Returns userAssets[]
 * ============================================================================
 */
async function buildUserAssets(userId) {
  const objects = await fgaClient.getUserSubscriptions(userId);

  return objects
    .map(obj => {
      const [type, id] = obj.split(":");

      const sub = subscriptionRepository.findById(id);
      if (!sub) return null;

      return {
        id: sub.id,
        entityType: type,
        accountId: sub.accountId,
        product: sub.product,
        entitlements: ["can_view"]
      };
    })
    .filter(Boolean);
}

module.exports = { buildUserAssets };
