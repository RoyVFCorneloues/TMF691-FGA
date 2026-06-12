/**
 * =============================================================================
 * TUPLE PLAN SERVICE
 * -----------------------------------------------------------------------------
 * Utilities for loading, normalising, and applying tuple plans.
 * All FGA read/write operations are delegated to an AuthorizationProvider,
 * making this module provider-agnostic.
 *
 * PUBLIC API:
 *   loadTuplePlanFromFile(filePath)
 *   normaliseTuplePlan(plan)
 *   processTuplePlan(provider, tuplePlan, { dryRun })
 *   processTuplePlanFromFile(provider, filePath, { dryRun })
 *
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');

/**
 * ============================================================================
 * LOAD TUPLE PLAN FROM FILE
 * ----------------------------------------------------------------------------
 * Reads a tuple plan JSON file from disk.
 *
 * Expected shape:
 * {
 *   "write": [],
 *   "delete": []
 * }
 *
 * @param {string} filePath
 *
 * Returns:
 *   Parsed tuple plan object
 * ============================================================================
 */
function loadTuplePlanFromFile(filePath) {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * ============================================================================
 * NORMALISE TUPLE PLAN
 * ----------------------------------------------------------------------------
 * Ensures write/delete arrays exist even if omitted.
 *
 * Missing arrays are treated as empty.
 *
 * @param {Object} plan
 *
 * Returns:
 *   { write: [], delete: [] }
 * ============================================================================
 */
function normaliseTuplePlan(plan = {}) {
  return {
    write: Array.isArray(plan.write) ? plan.write : [],
    delete: Array.isArray(plan.delete) ? plan.delete : []
  };
}

/**
 * ============================================================================
 * PROCESS TUPLE PLAN
 * ----------------------------------------------------------------------------
 * Validates and optionally applies a tuple plan using the given provider.
 *
 * RULES:
 *   - Missing arrays => treated as empty
 *   - Empty arrays   => no-op, with logging
 *   - write          => error if tuple already exists
 *   - delete         => error if tuple does not exist
 *
 * @param {AuthorizationProvider} provider
 * @param {Object}  tuplePlan
 * @param {Object}  options
 * @param {boolean} options.dryRun
 *
 * Returns:
 *   Promise<Object>  Summary object
 * ============================================================================
 */
async function processTuplePlan(provider, tuplePlan, { dryRun = false } = {}) {
  const plan = normaliseTuplePlan(tuplePlan);

  if (plan.write.length === 0) {
    console.log('ℹ️ No tuples to write');
  }

  if (plan.delete.length === 0) {
    console.log('ℹ️ No tuples to delete');
  }

  const errors = [];
  const actions = {
    write: [],
    delete: []
  };

  // Validate writes
  for (const tuple of plan.write) {
    const tuples = await provider.readTuple(tuple);
    const exists = tuples.some(t =>
      t.key?.user === tuple.user &&
      t.key?.relation === tuple.relation &&
      t.key?.object === tuple.object
    );

    if (exists) {
      errors.push({
        action: 'write',
        tuple,
        message: 'Tuple already exists'
      });
    } else {
      actions.write.push(tuple);
    }
  }

  // Validate deletes
  for (const tuple of plan.delete) {
    const tuples = await provider.readTuple(tuple);
    const exists = tuples.some(t =>
      t.key?.user === tuple.user &&
      t.key?.relation === tuple.relation &&
      t.key?.object === tuple.object
    );

    if (!exists) {
      errors.push({
        action: 'delete',
        tuple,
        message: 'Tuple does not exist'
      });
    } else {
      actions.delete.push(tuple);
    }
  }

  const summary = {
    dryRun,
    requested: {
      write: plan.write.length,
      delete: plan.delete.length
    },
    valid: {
      write: actions.write.length,
      delete: actions.delete.length
    },
    errors
  };

  if (dryRun) {
    console.log('🧪 Dry run complete:', summary);
    return {
      ...summary,
      note: 'No changes were written to FGA'
    };
  }

  if (errors.length > 0) {
    const err = new Error('Tuple plan validation failed');
    err.details = summary;
    throw err;
  }

  if (actions.write.length === 0 && actions.delete.length === 0) {
    console.log('ℹ️ Nothing to apply');
    return {
      ...summary,
      applied: {
        writes: 0,
        deletes: 0
      }
    };
  }

  await provider.writeTupleBatch({
    writes: actions.write,
    deletes: actions.delete
  });

  return {
    ...summary,
    applied: {
      writes: actions.write.length,
      deletes: actions.delete.length
    }
  };
}

/**
 * ============================================================================
 * PROCESS TUPLE PLAN FROM FILE
 * ----------------------------------------------------------------------------
 * Reads a tuple plan JSON file from disk and processes it.
 *
 * @param {AuthorizationProvider} provider
 * @param {string} filePath
 * @param {Object} options
 * @param {boolean} options.dryRun
 *
 * Returns:
 *   Promise<Object>  Summary object
 * ============================================================================
 */
async function processTuplePlanFromFile(provider, filePath, { dryRun = false } = {}) {
  const plan = loadTuplePlanFromFile(filePath);
  return processTuplePlan(provider, plan, { dryRun });
}

module.exports = {
  loadTuplePlanFromFile,
  normaliseTuplePlan,
  processTuplePlan,
  processTuplePlanFromFile
};
