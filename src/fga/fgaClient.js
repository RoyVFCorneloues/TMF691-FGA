/**
 * =============================================================================
 * FGA CLIENT (backward-compatibility shim)
 * -----------------------------------------------------------------------------
 * This module is kept for backward compatibility.
 * New code should import from src/authorization instead:
 *
 *   const authProvider = require('../authorization');
 *
 * Tuple plan utilities (processTuplePlan, processTuplePlanFromFile) are now in:
 *
 *   const { processTuplePlan } = require('../authorization/tuplePlanService');
 *
 * =============================================================================
 */

const authProvider = require('../authorization');
const tuplePlanService = require('../authorization/tuplePlanService');

module.exports = {
  // AuthorizationProvider interface
  listObjects: (userId, relation, type) => authProvider.listUserObjects(userId, relation, type),
  getUserSubscriptions: (userId) => authProvider.getUserSubscriptions(userId),
  readTuple: (tuple) => authProvider.readTuple(tuple),
  tupleExists: (tuple) => authProvider.tupleExists(tuple),
  writeTupleBatch: (params) => authProvider.writeTupleBatch(params),

  // Tuple plan utilities (now provider-aware)
  loadTuplePlanFromFile: tuplePlanService.loadTuplePlanFromFile,
  normaliseTuplePlan: tuplePlanService.normaliseTuplePlan,
  processTuplePlan: (plan, opts) => tuplePlanService.processTuplePlan(authProvider, plan, opts),
  processTuplePlanFromFile: (filePath, opts) => tuplePlanService.processTuplePlanFromFile(authProvider, filePath, opts)
};
