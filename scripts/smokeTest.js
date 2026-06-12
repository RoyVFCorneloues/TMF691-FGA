/**
 * =============================================================================
 * SMOKE TEST – Authorization Provider Wiring
 * -----------------------------------------------------------------------------
 * Exercises the provider factory, interface, and key helper modules without
 * making real network calls to Auth0 FGA.
 *
 * Run with:
 *   node scripts/smokeTest.js
 *
 * Expected output: a series of ✅ pass lines and a final summary.
 * =============================================================================
 */

'use strict';

require('dotenv').config();

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// 1. AuthorizationProvider base class
// ---------------------------------------------------------------------------
console.log('\n── 1. AuthorizationProvider interface ──');

const AuthorizationProvider = require('../src/authorization/authorizationProvider');

assert(typeof AuthorizationProvider === 'function', 'AuthorizationProvider is a class');

const base = new AuthorizationProvider();
['listUserObjects', 'readTuple', 'writeTupleBatch'].forEach(method => {
  assert(typeof base[method] === 'function', `base.${method}() exists`);
  base[method]().catch(err => {
    assert(
      err.message.includes('must be implemented'),
      `base.${method}() throws "must be implemented"`
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Auth0FgaProvider
// ---------------------------------------------------------------------------
console.log('\n── 2. Auth0FgaProvider ──');

const Auth0FgaProvider = require('../src/authorization/auth0FgaProvider');

assert(typeof Auth0FgaProvider === 'function', 'Auth0FgaProvider is a class');

const provider = new Auth0FgaProvider();
assert(provider instanceof AuthorizationProvider, 'Auth0FgaProvider extends AuthorizationProvider');
assert(typeof provider.listUserObjects === 'function', 'provider.listUserObjects() exists');
assert(typeof provider.readTuple === 'function', 'provider.readTuple() exists');
assert(typeof provider.writeTupleBatch === 'function', 'provider.writeTupleBatch() exists');
assert(typeof provider.getUserSubscriptions === 'function', 'provider.getUserSubscriptions() exists');
assert(typeof provider.tupleExists === 'function', 'provider.tupleExists() exists');

// ---------------------------------------------------------------------------
// 3. Factory (index.js)
// ---------------------------------------------------------------------------
console.log('\n── 3. Authorization factory ──');

const { createProvider } = require('../src/authorization');

assert(typeof createProvider === 'function', 'createProvider() is exported');

const auth0Instance = createProvider('auth0');
assert(auth0Instance instanceof Auth0FgaProvider, 'createProvider("auth0") returns Auth0FgaProvider');

let factoryError = null;
try {
  createProvider('unknown_provider');
} catch (err) {
  factoryError = err;
}
assert(factoryError !== null, 'createProvider("unknown_provider") throws');
assert(
  factoryError && factoryError.message.includes('Unknown AUTH_PROVIDER'),
  'error message mentions AUTH_PROVIDER'
);

const defaultInstance = require('../src/authorization');
assert(
  defaultInstance instanceof Auth0FgaProvider,
  'default export is an Auth0FgaProvider instance'
);

// ---------------------------------------------------------------------------
// 4. tuplePlanService
// ---------------------------------------------------------------------------
console.log('\n── 4. tuplePlanService ──');

const tuplePlanService = require('../src/authorization/tuplePlanService');

assert(typeof tuplePlanService.loadTuplePlanFromFile === 'function', 'loadTuplePlanFromFile() exists');
assert(typeof tuplePlanService.normaliseTuplePlan === 'function', 'normaliseTuplePlan() exists');
assert(typeof tuplePlanService.processTuplePlan === 'function', 'processTuplePlan() exists');
assert(typeof tuplePlanService.processTuplePlanFromFile === 'function', 'processTuplePlanFromFile() exists');

const normalised = tuplePlanService.normaliseTuplePlan({});
assert(Array.isArray(normalised.write), 'normaliseTuplePlan({}).write is an array');
assert(Array.isArray(normalised.delete), 'normaliseTuplePlan({}).delete is an array');

const normalisedPartial = tuplePlanService.normaliseTuplePlan({ write: [{ user: 'a', relation: 'b', object: 'c' }] });
assert(normalisedPartial.write.length === 1, 'normaliseTuplePlan preserves write entries');
assert(normalisedPartial.delete.length === 0, 'normaliseTuplePlan defaults delete to []');

// ---------------------------------------------------------------------------
// 5. userAssetsService factory
// ---------------------------------------------------------------------------
console.log('\n── 5. userAssetsService ──');

const { createUserAssetsService } = require('../src/services/userAssetsService');

assert(typeof createUserAssetsService === 'function', 'createUserAssetsService() is exported');

const mockAuthProvider = {
  listUserObjects: async () => []
};
const mockDataProvider = {
  findSubscriptionById: () => undefined
};
const svc = createUserAssetsService(mockAuthProvider, mockDataProvider);
assert(typeof svc.buildUserAssets === 'function', 'service.buildUserAssets() exists after DI');

(async () => {
  const result = await svc.buildUserAssets('test-user');
  assert(Array.isArray(result), 'buildUserAssets() returns an array');
  assert(result.length === 0, 'buildUserAssets() returns empty array for empty provider');

  // ---------------------------------------------------------------------------
  // 6. fgaClient backward-compat shim
  // ---------------------------------------------------------------------------
  console.log('\n── 6. fgaClient shim ──');

  const fgaClient = require('../src/fga/fgaClient');
  ['listObjects', 'getUserSubscriptions', 'readTuple', 'tupleExists',
    'writeTupleBatch', 'loadTuplePlanFromFile', 'normaliseTuplePlan',
    'processTuplePlan', 'processTuplePlanFromFile'].forEach(fn => {
    assert(typeof fgaClient[fn] === 'function', `fgaClient.${fn}() exists (shim)`);
  });

  // ---------------------------------------------------------------------------
  // 7. DataSourceProvider base class
  // ---------------------------------------------------------------------------
  console.log('\n── 7. DataSourceProvider interface ──');

  const DataSourceProvider = require('../src/data/dataSourceProvider');

  assert(typeof DataSourceProvider === 'function', 'DataSourceProvider is a class');

  const baseDs = new DataSourceProvider();
  [
    'init', 'findSubscriptionById', 'findSubscriptionsByAccountId',
    'getAllSubscriptions', 'reloadSubscriptions',
    'findCustomerById', 'getAllCustomers', 'reloadCustomers',
    'getTmfAccounts', 'getTmfSubscriptions', 'getTmfRoles'
  ].forEach(method => {
    assert(typeof baseDs[method] === 'function', `DataSourceProvider.${method}() exists`);
    let threw = false;
    try { baseDs[method](); } catch (e) { threw = e.message.includes('must be implemented'); }
    assert(threw, `DataSourceProvider.${method}() throws "must be implemented"`);
  });

  // ---------------------------------------------------------------------------
  // 8. JsonFileProvider
  // ---------------------------------------------------------------------------
  console.log('\n── 8. JsonFileProvider ──');

  const JsonFileProvider = require('../src/data/jsonFileProvider');

  assert(typeof JsonFileProvider === 'function', 'JsonFileProvider is a class');

  const jsonProvider = new JsonFileProvider();
  assert(jsonProvider instanceof DataSourceProvider, 'JsonFileProvider extends DataSourceProvider');
  [
    'init', 'findSubscriptionById', 'findSubscriptionsByAccountId',
    'getAllSubscriptions', 'reloadSubscriptions',
    'findCustomerById', 'getAllCustomers', 'reloadCustomers',
    'getTmfAccounts', 'getTmfSubscriptions', 'getTmfRoles'
  ].forEach(method => {
    assert(typeof jsonProvider[method] === 'function', `JsonFileProvider.${method}() exists`);
  });

  // ---------------------------------------------------------------------------
  // 9. Data source factory (index.js)
  // ---------------------------------------------------------------------------
  console.log('\n── 9. Data source factory ──');

  const { createDataProvider } = require('../src/data');

  assert(typeof createDataProvider === 'function', 'createDataProvider() is exported');

  const jsonInstance = createDataProvider('json');
  assert(jsonInstance instanceof JsonFileProvider, 'createDataProvider("json") returns JsonFileProvider');

  let dsFactoryError = null;
  try {
    createDataProvider('unknown_provider');
  } catch (err) {
    dsFactoryError = err;
  }
  assert(dsFactoryError !== null, 'createDataProvider("unknown_provider") throws');
  assert(
    dsFactoryError && dsFactoryError.message.includes('Unknown DATA_PROVIDER'),
    'error message mentions DATA_PROVIDER'
  );

  const defaultDsInstance = require('../src/data');
  assert(
    defaultDsInstance instanceof JsonFileProvider,
    'default data export is a JsonFileProvider instance'
  );

  // ---------------------------------------------------------------------------
  // 10. userAssetsService with data provider DI
  // ---------------------------------------------------------------------------
  console.log('\n── 10. userAssetsService with data provider DI ──');

  const mockAuthProv = { listUserObjects: async () => ['subscription:S1'] };
  const mockDataProv = {
    findSubscriptionById: (id) => id === 'S1'
      ? { id: 'S1', accountId: 'A1', product: 'Test Plan' }
      : undefined
  };
  const svcWithData = createUserAssetsService(mockAuthProv, mockDataProv);
  const enrichedAssets = await svcWithData.buildUserAssets('test-user');
  assert(enrichedAssets.length === 1, 'buildUserAssets() returns enriched asset when subscription found');
  assert(enrichedAssets[0].id === 'S1', 'enriched asset has correct id');
  assert(enrichedAssets[0].product === 'Test Plan', 'enriched asset has correct product');

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log(`\n══════════════════════════════════════`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log(`══════════════════════════════════════\n`);

  process.exit(failed > 0 ? 1 : 0);
})();
