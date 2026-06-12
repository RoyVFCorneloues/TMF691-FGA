const subscriptionRepository = require('../repositories/subscriptionRepository');

/**
 * ============================================================================
 * CREATE USER ASSETS SERVICE
 * ----------------------------------------------------------------------------
 * Factory that binds an AuthorizationProvider to the service.
 * Returns an object with the buildUserAssets method.
 *
 * @param {AuthorizationProvider} authProvider
 * ============================================================================
 */
function createUserAssetsService(authProvider) {
  /**
   * ============================================================================
   * BUILD USER ASSETS
   * ----------------------------------------------------------------------------
   * Orchestrates:
   *   1. Calls the authorization provider to get authorised subscriptions
   *   2. Enriches using repository
   *   3. Returns userAssets[]
   * ============================================================================
   */
  async function buildUserAssets(userId) {
    const objects = await authProvider.listUserObjects(userId, 'can_view', 'subscription');

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

  return { buildUserAssets };
}

module.exports = { createUserAssetsService };
