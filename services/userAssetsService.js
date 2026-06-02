const subscriptionRepo = require('../repositories/subscriptionRepository');

async function buildUserAssets(objects) {
  return objects
    .map(obj => {
      const [type, id] = obj.split(":");

      const sub = subscriptionRepo.findById(id);
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
