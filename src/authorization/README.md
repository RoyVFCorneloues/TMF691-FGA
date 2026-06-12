> ⚠️ Proof of Concept – not production hardened

# Authorization Interface (FGA / PDP)

## Purpose and scope

`src/authorization/` defines the **Policy Decision Point (PDP)** abstraction for this project.  Every authorization decision flows through an `AuthorizationProvider` instance; concrete implementations (e.g. `Auth0FgaProvider`) are selected at startup via the `AUTH_PROVIDER` environment variable.

---

## Method table

| Method | Signature | Description | Returns |
|--------|-----------|-------------|---------|
| `listUserObjects` | `(userId, relation, type)` | All objects of `type` that `userId` holds `relation` to | `Promise<string[]>` |
| `readTuple` | `(tuple)` | Read tuples matching the provided key | `Promise<Object[]>` |
| `writeTupleBatch` | `({ writes, deletes })` | Apply a batch of tuple writes and/or deletes | `Promise<Object>` |
| `writeAssertions` | `(assertions)` | Replace all assertions for the active model (developer mode) | `Promise<void>` |
| `readAssertions` | `()` | Retrieve all current assertions | `Promise<Object[]>` |
| `clearAssertions` | `()` | Remove all assertions (writes empty array) | `Promise<void>` |

---

## Input / output shapes

### `listUserObjects(userId, relation, type)`

```json
// Input
userId   = "mr-b"
relation = "can_view"
type     = "subscription"

// Output
["subscription:S1", "subscription:S2", "subscription:S3"]
```

### `readTuple(tuple)`

```json
// Input
{
  "user": "user:mr-b",
  "relation": "owner",
  "object": "account:A1"
}

// Output
[
  {
    "key": { "user": "user:mr-b", "relation": "owner", "object": "account:A1" },
    "timestamp": "2024-01-01T00:00:00Z"
  }
]
```

### `writeTupleBatch({ writes, deletes })`

```json
// Input
{
  "writes": [
    { "user": "user:mr-b",    "relation": "owner",  "object": "account:A1"      },
    { "user": "account:A1",   "relation": "parent", "object": "subscription:S1" }
  ],
  "deletes": []
}

// Output – raw FGA API response (provider-specific)
{}
```

### `writeAssertions(assertions)`

```json
// Input
[
  {
    "tuple_key": { "user": "user:mr-b", "relation": "can_view", "object": "subscription:S1" },
    "expectation": true
  },
  {
    "tuple_key": { "user": "user:anne", "relation": "can_view", "object": "subscription:S1" },
    "expectation": false
  }
]

// Output – void
```

### `readAssertions()`

```json
// Output
[
  {
    "tuple_key": { "user": "user:mr-b", "relation": "can_view", "object": "subscription:S1" },
    "expectation": true
  }
]
```

---

## Error-handling expectations

| Context | Behaviour |
|---------|-----------|
| **PoC** | Methods throw the raw error from the underlying API (no wrapping or retry). |
| **Production** | Wrap errors with context, add retry/back-off, emit structured logs. |

---

## Factory and provider discovery

The factory in `src/authorization/index.js` reads the `AUTH_PROVIDER` environment variable and returns a singleton instance:

```javascript
// src/authorization/index.js
const authProvider = require('./src/authorization');
// authProvider is already instantiated and ready to use
```

### Adding a new provider

1. Create `src/authorization/myProvider.js` that extends `AuthorizationProvider`:

```javascript
const AuthorizationProvider = require('./authorizationProvider');

class MyProvider extends AuthorizationProvider {
  async listUserObjects(userId, relation, type) { /* … */ }
  async readTuple(tuple)                        { /* … */ }
  async writeTupleBatch({ writes, deletes })    { /* … */ }
  async writeAssertions(assertions)             { /* … */ }
  async readAssertions()                        { /* … */ }
  async clearAssertions()                       { /* … */ }
}

module.exports = MyProvider;
```

2. Register the new provider in `src/authorization/index.js`:

```javascript
const MyProvider = require('./myProvider');

switch (name) {
  case 'auth0': return new Auth0FgaProvider();
  case 'my':    return new MyProvider();
  // …
}
```

3. Set the environment variable:

```bash
AUTH_PROVIDER=my
```

---

## Helper services

| Module | Description |
|--------|-------------|
| `src/authorization/tuplePlanService.js` | Load, validate, and apply tuple plans from files or objects |
| `src/authorization/assertionService.js` | Load, clear, and replace assertion sets from files or objects |

Import recommended paths:

```javascript
const authProvider          = require('./src/authorization');               // provider singleton
const tuplePlanService      = require('./src/authorization/tuplePlanService');
const assertionService      = require('./src/authorization/assertionService');
```

---

## `fgaClient` shim

`src/fga/fgaClient.js` is a **backward-compatibility shim** that re-exports the provider and helper services.  New code should import directly from `src/authorization`:

```javascript
// ✅ Preferred
const authProvider = require('./src/authorization');

// ⚠️  Legacy – still works, but avoid in new code
const fgaClient = require('./src/fga/fgaClient');
```

---

## Smoke test / minimal usage example

```javascript
const AuthorizationProvider = require('./src/authorization/authorizationProvider');

// Verify the interface is a class with required methods
const base = new AuthorizationProvider();
console.log(typeof base.listUserObjects);  // "function"
console.log(typeof base.readTuple);        // "function"
console.log(typeof base.writeTupleBatch);  // "function"

// Each unimplemented method rejects with "must be implemented"
base.listUserObjects().catch(err => console.log(err.message));
// → "listUserObjects() must be implemented by the provider"
```

Run the full smoke test:

```bash
npm test
```

---

## Implementations

- [`auth0FgaProvider.js`](./auth0FgaProvider.js) — Auth0 Fine Grained Authorization ([README](./auth0FgaProvider/README.md))
