/**
 * ============================================================================
 * CREATE USER ASSETS SERVICE
 * ----------------------------------------------------------------------------
 * Factory that binds an AuthorizationProvider and a DataSourceProvider to
 * the service.  Returns an object with the buildUserAssets method.
 *
 * @param {AuthorizationProvider} authProvider
 * @param {DataSourceProvider}    dataProvider
 * ============================================================================
 */
function createUserAssetsService(authProvider, dataProvider) {
  /**
   * ============================================================================
   * BUILD USER ASSETS
   * ----------------------------------------------------------------------------
   * Orchestrates:
   *   1. Calls the authorization provider to get authorised subscriptions
   *   2. Enriches using the data-source provider
   *   3. Returns userAssets[]
   * ============================================================================
   */
  async function buildUserAssets(userId) {
    const objects = await authProvider.listUserObjects(userId, 'can_view', 'subscription');

    return (await Promise.all(
      objects.map(async obj => {
        const [type, id] = obj.split(":");

        const sub = await dataProvider.findSubscriptionById(id);
        if (!sub) return null;

        return {
          id: sub.id,
          entityType: type,
          accountId: sub.accountId,
          product: sub.product,
          entitlements: ["can_view"]
        };
      })
    )).filter(Boolean);
  }

  return { buildUserAssets };
}

module.exports = { createUserAssetsService };
