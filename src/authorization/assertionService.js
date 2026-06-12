/**
 * =============================================================================
 * ASSERTION SERVICE
 * -----------------------------------------------------------------------------
 * Utilities for loading and applying assertion plans.
 * All FGA read/write operations are delegated to an AuthorizationProvider,
 * making this module provider-agnostic.
 *
 * Assertions are model-scoped test artefacts used in Developer Mode to verify
 * that expected access outcomes are correctly enforced. They are not part of
 * the runtime authorisation flow.
 *
 * PUBLIC API:
 *   loadAssertionsFromFile(filePath)
 *   processAssertions(provider, assertions)
 *   processAssertionsFromFile(provider, filePath)
 *
 * =============================================================================
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * ============================================================================
 * LOAD ASSERTIONS FROM FILE
 * ----------------------------------------------------------------------------
 * Reads an assertions JSON file from disk.
 *
 * Expected shape:
 * {
 *   "assertions": [
 *     {
 *       "tuple_key": { "user": "user:anne", "relation": "reader", "object": "document:roadmap" },
 *       "expectation": true
 *     }
 *   ]
 * }
 *
 * @param {string} filePath
 *
 * Returns:
 *   Object[]  Parsed assertions array
 * ============================================================================
 */
function loadAssertionsFromFile(filePath) {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, 'utf-8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : (parsed.assertions || []);
}

/**
 * ============================================================================
 * PROCESS ASSERTIONS
 * ----------------------------------------------------------------------------
 * Clears existing assertions and writes the provided assertions.
 *
 * BEHAVIOUR:
 *   1. Clears all existing assertions for the active authorization model.
 *   2. Writes the new assertions array.
 *
 * @param {AuthorizationProvider} provider
 * @param {Object[]} assertions  - Array of assertion objects, each containing:
 *   { tuple_key: { user, relation, object }, expectation: boolean }
 *
 * Returns:
 *   Promise<Object>  Summary object
 * ============================================================================
 */
async function processAssertions(provider, assertions = []) {
  console.log(`ℹ️ Clearing existing assertions before applying ${assertions.length} new assertion(s)`);
  await provider.clearAssertions();

  if (assertions.length === 0) {
    console.log('ℹ️ No assertions to write');
    return { cleared: true, written: 0 };
  }

  await provider.writeAssertions(assertions);
  console.log(`✅ ${assertions.length} assertion(s) written`);

  return { cleared: true, written: assertions.length };
}

/**
 * ============================================================================
 * PROCESS ASSERTIONS FROM FILE
 * ----------------------------------------------------------------------------
 * Reads an assertions JSON file from disk and processes it.
 *
 * @param {AuthorizationProvider} provider
 * @param {string} filePath
 *
 * Returns:
 *   Promise<Object>  Summary object
 * ============================================================================
 */
async function processAssertionsFromFile(provider, filePath) {
  const assertions = loadAssertionsFromFile(filePath);
  return processAssertions(provider, assertions);
}

module.exports = {
  loadAssertionsFromFile,
  processAssertions,
  processAssertionsFromFile
};
