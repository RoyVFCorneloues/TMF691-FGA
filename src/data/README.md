> ⚠️ Proof of Concept – not production hardened

# Data Source Interface (PIP)

## Purpose and scope

`src/data/` defines the **Policy Information Point (PIP)** abstraction for this project.  Every data access goes through a `DataSourceProvider` instance; concrete implementations (e.g. `JsonFileProvider`) are selected at startup via the `DATA_PROVIDER` environment variable.

---

## Method table

### Lifecycle

| Method | Signature | Description | Returns |
|--------|-----------|-------------|---------|
| `init` | `()` | Initialise all data sources (load files, set up watchers, etc.) | `void \| Promise<void>` |

### Subscriptions

| Method | Signature | Description | Returns |
|--------|-----------|-------------|---------|
| `findSubscriptionById` | `(id)` | Look up a single subscription by its identifier | `Subscription \| undefined` |
| `findSubscriptionsByAccountId` | `(accountId)` | All subscriptions linked to an account | `Subscription[]` |
| `getAllSubscriptions` | `()` | Full subscription dataset | `Subscription[]` |
| `reloadSubscriptions` | `()` | Force a reload; returns the number of loaded records | `number` |

### Customers

| Method | Signature | Description | Returns |
|--------|-----------|-------------|---------|
| `findCustomerById` | `(id)` | Look up a single customer/party record by its identifier | `Customer \| undefined` |
| `getAllCustomers` | `()` | Full customer dataset | `Customer[]` |
| `reloadCustomers` | `()` | Force a reload; returns the number of loaded records | `number` |

### TMF data

| Method | Signature | Description | Returns |
|--------|-----------|-------------|---------|
| `getTmfAccounts` | `()` | TMF account records | `Object[]` |
| `getTmfSubscriptions` | `()` | TMF subscription records | `Object[]` |
| `getTmfRoles` | `()` | TMF party-role records | `Object[]` |

---

## Input / output shapes

### `findSubscriptionById(id)`

```json
// Input
id = "S1"

// Output
{
  "id": "S1",
  "accountId": "A1",
  "product": "Mobile Plan"
}
```

Returns `undefined` when no match is found.

### `findSubscriptionsByAccountId(accountId)`

```json
// Input
accountId = "A1"

// Output
[
  { "id": "S1", "accountId": "A1", "product": "Mobile Plan" },
  { "id": "S2", "accountId": "A1", "product": "Broadband"   }
]
```

### `findCustomerById(id)`

```json
// Input
id = "mr-b"

// Output
{
  "id": "mr-b",
  "name": "Mr B",
  "accounts": ["A1", "A2"]
}
```

Returns `undefined` when no match is found.

### `getTmfAccounts()`

```json
// Output
[
  { "id": "A1", "name": "Account One", "partyId": "mr-b" },
  { "id": "A2", "name": "Account Two", "partyId": "mr-b" }
]
```

### `reloadSubscriptions()` / `reloadCustomers()`

```json
// Output
5   // number of records loaded
```

---

## Error-handling expectations

| Context | Behaviour |
|---------|-----------|
| **PoC** | Methods throw the raw error (file not found, parse error, etc.) with no wrapping. |
| **Production** | Wrap errors with context, add fallback/cache, emit structured logs. |

---

## Factory and provider discovery

The factory in `src/data/index.js` reads the `DATA_PROVIDER` environment variable and returns a singleton instance:

```javascript
const dataProvider = require('./src/data');
dataProvider.init();                                  // call once at startup

const sub      = dataProvider.findSubscriptionById('S1');
const customer = dataProvider.findCustomerById('mr-b');
const accounts = dataProvider.getTmfAccounts();
```

### Adding a new provider

1. Create `src/data/myProvider.js` that extends `DataSourceProvider`:

```javascript
const DataSourceProvider = require('./dataSourceProvider');

class MyProvider extends DataSourceProvider {
  init()                                  { /* connect to your API */ }
  findSubscriptionById(id)                { /* call TMF Product API */ }
  findSubscriptionsByAccountId(accountId) { /* … */ }
  getAllSubscriptions()                    { /* … */ }
  reloadSubscriptions()                   { /* … */ }
  findCustomerById(id)                    { /* call TMF Party API */ }
  getAllCustomers()                        { /* … */ }
  reloadCustomers()                       { /* … */ }
  getTmfAccounts()                        { /* … */ }
  getTmfSubscriptions()                   { /* … */ }
  getTmfRoles()                           { /* … */ }
}

module.exports = MyProvider;
```

2. Register the new provider in `src/data/index.js`:

```javascript
const MyProvider = require('./myProvider');

switch (name) {
  case 'json':   return new JsonFileProvider();
  case 'my_api': return new MyProvider();
  // …
}
```

3. Set the environment variable:

```bash
DATA_PROVIDER=my_api
```

---

## Dependency injection in services

Services receive the provider via their factory function, making them independently testable:

```javascript
const { createUserAssetsService } = require('./src/services/userAssetsService');

// Production wiring
const authProvider = require('./src/authorization');
const dataProvider = require('./src/data');
const service = createUserAssetsService(authProvider, dataProvider);

// Test wiring (mock provider)
const mockDataProvider = { findSubscriptionById: (id) => ({ id, product: 'Test' }) };
const testService = createUserAssetsService(mockAuthProvider, mockDataProvider);
```

---

## Smoke test / minimal usage example

```javascript
const DataSourceProvider = require('./src/data/dataSourceProvider');

// Verify the interface is a class with required methods
const base = new DataSourceProvider();
console.log(typeof base.findSubscriptionById); // "function"
console.log(typeof base.findCustomerById);     // "function"

// Each unimplemented method throws "must be implemented"
try { base.findSubscriptionById('S1'); } catch (err) { console.log(err.message); }
// → "findSubscriptionById() must be implemented by the provider"
```

Run the full smoke test:

```bash
npm test
```

---

## Implementations

| Provider | `DATA_PROVIDER` value | Description |
|----------|----------------------|-------------|
| [`JsonFileProvider`](./jsonFileProvider.js) | `json` *(default)* | Reads from local JSON files in `src/data/` |
