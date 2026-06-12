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
 * Assertion utilities are now in:
 *
 *   const { processAssertions } = require('../authorization/assertionService');
 *
 * =============================================================================
 */

const authProvider = require('../authorization');
const tuplePlanService = require('../authorization/tuplePlanService');
const assertionService = require('../authorization/assertionService');

module.exports = {
  // AuthorizationProvider interface
  listObjects: (userId, relation, type) => authProvider.listUserObjects(userId, relation, type),
  getUserSubscriptions: (userId) => authProvider.getUserSubscriptions(userId),
  readTuple: (tuple) => authProvider.readTuple(tuple),
  tupleExists: (tuple) => authProvider.tupleExists(tuple),
  writeTupleBatch: (params) => authProvider.writeTupleBatch(params),

  // Assertion methods
  writeAssertions: (assertions) => authProvider.writeAssertions(assertions),
  readAssertions: () => authProvider.readAssertions(),
  clearAssertions: () => authProvider.clearAssertions(),

  // Tuple plan utilities (now provider-aware)
  loadTuplePlanFromFile: tuplePlanService.loadTuplePlanFromFile,
  normaliseTuplePlan: tuplePlanService.normaliseTuplePlan,
  processTuplePlan: (plan, opts) => tuplePlanService.processTuplePlan(authProvider, plan, opts),
  processTuplePlanFromFile: (filePath, opts) => tuplePlanService.processTuplePlanFromFile(authProvider, filePath, opts),

  // Assertion utilities (provider-aware)
  loadAssertionsFromFile: assertionService.loadAssertionsFromFile,
  processAssertions: (assertions) => assertionService.processAssertions(authProvider, assertions),
  processAssertionsFromFile: (filePath) => assertionService.processAssertionsFromFile(authProvider, filePath)
};
