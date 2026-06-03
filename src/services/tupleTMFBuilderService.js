const tmfRepository = require('../repositories/tmfRepository');

/**
 * ============================================================================
 * BUILD TUPLES FROM TMF DATA
 * ============================================================================
 */
function buildTuples() {
  const roles = tmfRepository.getRoles();
  const subscriptions = tmfRepository.getSubscriptions();

  const tuples = {
    write: []
  };

  // 🔹 1. Account → Subscription relationship
  for (const sub of subscriptions) {
    tuples.write.push({
      user: `account:${sub.accountId}`,
      relation: 'parent',
      object: `subscription:${sub.id}`
    });
  }

  // 🔹 2. User → Account role relationship
  for (const role of roles) {
    tuples.write.push({
      user: `user:${role.partyId}`,
      relation: role.role,
      object: `account:${role.accountId}`
    });
  }

  return tuples;
}

module.exports = { buildTuples };
