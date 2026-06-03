/**
 * =============================================================================
 * FGA CLIENT
 * -----------------------------------------------------------------------------
 * Encapsulates communication with Auth0 Fine Grained Authorization (FGA).
 *
 * RESPONSIBILITIES:
 *   - Obtain OAuth access tokens
 *   - Query FGA (ListObjects / Read)
 *   - Apply tuple plans (write / delete only)
 *
 * NOTES:
 *   - FGA exposes tuple mutation via the /write endpoint
 *   - Tuple changes are modelled as explicit write + delete operations
 *   - There is no direct tuple "update" operation in this implementation
 *
 * =============================================================================
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

let accessToken = null;
let tokenExpiry = null;

/**
 * ============================================================================
 * GET ACCESS TOKEN
 * ----------------------------------------------------------------------------
 * Retrieves and caches an OAuth token for FGA API calls.
 *
 * Returns:
 *   String access token
 * ============================================================================
 */
async function getToken() {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await axios.post(
      'https://auth.fga.dev/oauth/token',
      {
        client_id: process.env.FGA_CLIENT_ID,
        client_secret: process.env.FGA_CLIENT_SECRET,
        audience: 'https://api.eu1.fga.dev/',
        grant_type: 'client_credentials'
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 5000;

    console.log('✅ FGA token acquired');
    return accessToken;

  } catch (err) {
    console.error('❌ Failed to get FGA token:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * ============================================================================
 * LIST OBJECTS
 * ----------------------------------------------------------------------------
 * Calls FGA ListObjects endpoint to retrieve resources a user can access.
 *
 * @param {string} userId   - User identifier (e.g. "mr-b")
 * @param {string} relation - Relation (e.g. "can_view")
 * @param {string} type     - Object type (e.g. "subscription")
 *
 * Returns:
 *   Array of object IDs (e.g. ["subscription:S1", "subscription:S2"])
 * ============================================================================
 */
async function listObjects(userId, relation, type) {
  try {
    const token = await getToken();

    const response = await axios.post(
      `${process.env.FGA_API_URL}/stores/${process.env.FGA_STORE_ID}/list-objects`,
      {
        user: `user:${userId}`,
        relation,
        type,
        authorization_model_id: process.env.FGA_MODEL_ID
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.objects || [];

  } catch (err) {
    console.error('❌ FGA ListObjects error:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * ============================================================================
 * GET USER SUBSCRIPTIONS
 * ----------------------------------------------------------------------------
 * Convenience method to retrieve subscriptions a user can view.
 *
 * @param {string} userId
 *
 * Returns:
 *   Array of subscription object references
 * ============================================================================
 */
async function getUserSubscriptions(userId) {
  return listObjects(userId, 'can_view', 'subscription');
}

/**
 * ============================================================================
 * READ TUPLE
 * ----------------------------------------------------------------------------
 * Reads tuples from FGA matching the provided tuple key.
 *
 * @param {{user: string, relation: string, object: string}} tuple
 *
 * Returns:
 *   Array of matching tuples
 * ============================================================================
 */
async function readTuple(tuple) {
  try {
    const token = await getToken();

    const response = await axios.post(
      `${process.env.FGA_API_URL}/stores/${process.env.FGA_STORE_ID}/read`,
      {
        tuple_key: {
          user: tuple.user,
          relation: tuple.relation,
          object: tuple.object
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.tuples || [];

  } catch (err) {
    console.error('❌ FGA ReadTuple error:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * ============================================================================
 * TUPLE EXISTS
 * ----------------------------------------------------------------------------
 * Checks whether a tuple already exists in FGA.
 *
 * @param {{user: string, relation: string, object: string}} tuple
 *
 * Returns:
 *   Boolean
 * ============================================================================
 */
async function tupleExists(tuple) {
  const tuples = await readTuple(tuple);

  return tuples.some(t =>
    t.key?.user === tuple.user &&
    t.key?.relation === tuple.relation &&
    t.key?.object === tuple.object
  );
}

/**
 * ============================================================================
 * WRITE TUPLE BATCH
 * ----------------------------------------------------------------------------
 * Calls FGA /write to add and/or delete tuples.
 *
 * @param {Object} params
 * @param {Array} params.writes  - Tuples to add
 * @param {Array} params.deletes - Tuples to delete
 *
 * Returns:
 *   Raw API response
 * ============================================================================
 */
async function writeTupleBatch({ writes = [], deletes = [] } = {}) {
  try {
    const token = await getToken();

    const payload = {
      ...(writes.length > 0 && {
        writes: {
          tuple_keys: writes.map(...)
        }
      }),
      ...(deletes.length > 0 && {
        deletes: {
          tuple_keys: deletes.map(...)
        }
      }),
      authorization_model_id: process.env.FGA_MODEL_ID
    };
    
    // 🔍 DEBUG: print payload
    console.log("\n📤 FGA WRITE PAYLOAD:");
    console.log(JSON.stringify(payload, null, 2));
    
    // USE payload here
    const response = await axios.post(
      `${process.env.FGA_API_URL}/stores/${process.env.FGA_STORE_ID}/write`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;

  } catch (err) {
    console.error('❌ FGA WriteTupleBatch error:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * ============================================================================
 * LOAD TUPLE PLAN FROM FILE
 * ----------------------------------------------------------------------------
 * Reads a tuple plan file from disk.
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
 * Validates and optionally applies a tuple plan.
 *
 * RULES:
 *   - Missing arrays => treated as empty
 *   - Empty arrays => no-op, with logging
 *   - write  => error if tuple already exists
 *   - delete => error if tuple does not exist
 *
 * @param {Object} tuplePlan
 * @param {Object} options
 * @param {boolean} options.dryRun
 *
 * Returns:
 *   Summary object
 * ============================================================================
 */
async function processTuplePlan(tuplePlan, { dryRun = false } = {}) {
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
    const exists = await tupleExists(tuple);

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
    const exists = await tupleExists(tuple);

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

  await writeTupleBatch({
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
 * Reads tuples.json from disk and processes it.
 *
 * @param {string} filePath
 * @param {Object} options
 * @param {boolean} options.dryRun
 *
 * Returns:
 *   Summary object
 * ============================================================================
 */
async function processTuplePlanFromFile(filePath, { dryRun = false } = {}) {
  const plan = loadTuplePlanFromFile(filePath);
  return processTuplePlan(plan, { dryRun });
}

module.exports = {
  listObjects,
  getUserSubscriptions,
  readTuple,
  tupleExists,
  writeTupleBatch,
  loadTuplePlanFromFile,
  processTuplePlan,
  processTuplePlanFromFile
};
