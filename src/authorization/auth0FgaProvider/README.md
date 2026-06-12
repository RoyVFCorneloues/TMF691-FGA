> ⚠️ Proof of Concept – not production hardened

# Auth0 FGA Provider

**File:** `src/authorization/auth0FgaProvider.js`  
**Interface:** [`AuthorizationProvider`](../README.md)  
**Selected by:** `AUTH_PROVIDER=auth0` (default)

## Purpose

Implements `AuthorizationProvider` using the [Auth0 Fine Grained Authorization](https://auth0.com/fine-grained-authorization) API.  Handles OAuth token acquisition (with caching), tuple reads/writes, and assertion management.

---

## Environment variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `FGA_API_URL` | ✅ | Base URL for the FGA API | `https://api.eu1.fga.dev` |
| `FGA_STORE_ID` | ✅ | FGA store identifier | `01J...` |
| `FGA_MODEL_ID` | ✅ | Authorization model ID | `01J...` |
| `FGA_CLIENT_ID` | ✅ | OAuth client ID (machine-to-machine) | `abc123` |
| `FGA_CLIENT_SECRET` | ✅ | OAuth client secret | `secret` |

Create a `.env` file in the project root (never commit this file):

```env
FGA_API_URL=https://api.eu1.fga.dev
FGA_STORE_ID=your_store_id
FGA_MODEL_ID=your_model_id
FGA_CLIENT_ID=your_client_id
FGA_CLIENT_SECRET=your_client_secret
```

### Where to find these values

1. Log in to the [Auth0 Dashboard](https://dashboard.auth0.com)
2. Navigate to **Fine Grained Authorization**
3. Create a store (if you haven't already)
4. Select your store → **Settings** → copy **Store ID** and **Model ID**
5. Create an API client for machine-to-machine access → copy **Client ID** and **Client Secret**

---

## Methods

This implementation provides all six interface methods plus two convenience helpers:

| Method | Description |
|--------|-------------|
| `listUserObjects(userId, relation, type)` | Calls FGA `POST /list-objects` |
| `readTuple(tuple)` | Calls FGA `POST /read` |
| `writeTupleBatch({ writes, deletes })` | Calls FGA `POST /write` |
| `writeAssertions(assertions)` | Calls FGA `PUT /assertions/{modelId}` |
| `readAssertions()` | Calls FGA `GET /assertions/{modelId}` |
| `clearAssertions()` | Calls `writeAssertions([])` |
| `getUserSubscriptions(userId)` *(convenience)* | Calls `listUserObjects(userId, 'can_view', 'subscription')` |
| `tupleExists(tuple)` *(convenience)* | Calls `readTuple` and checks for a match |

---

## Token management

- OAuth tokens are obtained via `POST https://auth.fga.dev/oauth/token` (client-credentials flow).
- Tokens are **cached in memory** and reused until 5 seconds before expiry.
- A new token is fetched automatically on the next call after expiry.

---

## Usage example

```javascript
const authProvider = require('./src/authorization'); // singleton Auth0FgaProvider

// List subscriptions a user can view
const objects = await authProvider.listUserObjects('mr-b', 'can_view', 'subscription');
// → ["subscription:S1", "subscription:S2"]

// Check a specific tuple
const exists = await authProvider.tupleExists({
  user: 'user:mr-b',
  relation: 'owner',
  object: 'account:A1'
});
// → true | false

// Write a tuple
await authProvider.writeTupleBatch({
  writes: [{ user: 'user:mr-b', relation: 'owner', object: 'account:A3' }],
  deletes: []
});
```

---

## Caveats and limitations (PoC notes)

- **No retry logic** – a failed API call throws immediately.
- **No request validation** – invalid tuple shapes may produce unclear FGA errors.
- **Single token cache** – not safe for multi-threaded/cluster deployments without a shared cache.
- **Assertions are model-scoped** – `writeAssertions` replaces *all* assertions for the active model; use with care.
- **Debug logging** – `writeTupleBatch` prints the full payload to stdout (intended for PoC transparency).

---

## Error handling

All methods follow the PoC convention: errors from the underlying `axios` call are logged to `stderr` and re-thrown without wrapping.

```javascript
// PoC
catch (err) {
  console.error('❌ FGA error:', err.response?.data || err.message);
  throw err;
}

// Production – wrap and add context
catch (err) {
  throw new FgaError(`listUserObjects failed for user ${userId}`, { cause: err });
}
```
