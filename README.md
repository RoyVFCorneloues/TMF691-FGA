> ⚠️ Proof of Concept – not production hardened

# FGA PEP Proof of Concept

## Overview

This project demonstrates a **Policy Enforcement Point (PEP)** pattern using Auth0 Fine Grained Authorization (FGA).  It retrieves authorised resources via FGA, enriches them with domain data, and returns a structured `userAssets` response without requiring OIDC userInfo.

**Key features:** FGA-driven authorization (ListObjects) · pluggable data abstraction (PIP) · tuple management · service-layer orchestration · demo endpoints

---

## Architecture

```
Client Request
    ↓
GET /userAssets/{userId}
    ↓
PEP (this API)
    ├→ FGA ListObjects Query  ← Authorization Provider (PDP) [src/authorization/]
    ├→ Data Enrichment        ← Data Source Provider (PIP)   [src/data/]
    └→ Response Shape
    ↓
userAssets[] response
```

| Component | Responsibility |
|-----------|----------------|
| **FGA** | Determines which resources user can access |
| **PEP** | Orchestrates calls, enriches data, shapes response |
| **Authorization Provider (PDP)** | Pluggable FGA back-end — see [`src/authorization/`](src/authorization/README.md) |
| **Data Source Provider (PIP)** | Pluggable data store — see [`src/data/`](src/data/README.md) |
| **Services** | Business logic (user assets, tuple building) |

---

## Quickstart

### Prerequisites
- Node.js 14+
- Auth0 FGA account (free tier at [auth0.com/fine-grained-authorization](https://auth0.com/fine-grained-authorization))

### Run locally

```bash
git clone https://github.com/RoyVFCorneloues/TMF691-FGA.git
cd TMF691-FGA
npm install
cp .env.example .env   # fill in your FGA credentials
node app.js
```

Server starts on `http://localhost:3000`.

### Demo sequence

```bash
curl http://localhost:3000/token              # verify FGA connectivity
curl http://localhost:3000/test-fga/mr-b     # raw FGA ListObjects
curl http://localhost:3000/userAssets/mr-b   # enriched PEP response
# or open in a browser:
# http://localhost:3000/userAssets-demo/mr-b
```

---

## Environment variables

Create a `.env` file in the project root (never commit it — it is already in `.gitignore`):

```env
# Auth0 FGA
FGA_API_URL=https://api.eu1.fga.dev
FGA_STORE_ID=your_store_id
FGA_MODEL_ID=your_model_id
FGA_CLIENT_ID=your_client_id
FGA_CLIENT_SECRET=your_client_secret

# Provider selection (optional — defaults shown)
AUTH_PROVIDER=auth0   # authorization back-end
DATA_PROVIDER=json    # data-source back-end
```

Find your FGA credentials: Dashboard → Fine Grained Authorization → your store → Settings, then create an M2M API client for the client ID/secret.

---

## Project structure

```
.
├── app.js                              # Express application & endpoints
├── scripts/
│   └── smokeTest.js                   # Offline smoke tests (npm test)
├── src/
│   ├── authorization/                 # Authorization Provider (PDP) ← see README
│   │   ├── README.md                  # Interface contract & usage guide
│   │   ├── authorizationProvider.js   # Abstract interface
│   │   ├── auth0FgaProvider.js        # Auth0 FGA implementation
│   │   ├── auth0FgaProvider/
│   │   │   └── README.md              # Auth0 FGA implementation notes
│   │   ├── tuplePlanService.js        # Tuple plan helpers
│   │   ├── assertionService.js        # Assertion helpers
│   │   └── index.js                   # Factory (AUTH_PROVIDER env var)
│   ├── data/                          # Data Source Provider (PIP) ← see README
│   │   ├── README.md                  # Interface contract & usage guide
│   │   ├── dataSourceProvider.js      # Abstract interface
│   │   ├── jsonFileProvider.js        # JSON-file implementation
│   │   ├── index.js                   # Factory (DATA_PROVIDER env var)
│   │   ├── subscriptions.json         # Mock subscription records
│   │   ├── customers.json             # Mock customer/party records
│   │   └── tmfData.json               # TMF domain model
│   ├── fga/
│   │   └── fgaClient.js               # Backward-compat shim → src/authorization/
│   ├── services/
│   │   ├── userAssetsService.js       # Orchestrate FGA + data enrichment
│   │   └── tupleTMFBuilderService.js  # Generate FGA tuples from TMF data
│   └── repositories/                  # Low-level JSON file readers (internal)
│       ├── subscriptionRepository.js
│       ├── customerRepository.js
│       └── tmfRepository.js
└── README.md                           # This file
```

---

## Smoke test

Run the offline test suite (110 assertions — no live FGA calls required):

```bash
npm test
```

Expected output:

```
── 1. AuthorizationProvider interface ──
  ✅ AuthorizationProvider is a class
  ✅ base.listUserObjects() exists
  …
══════════════════════════════════════
  Results: 110 passed, 0 failed
══════════════════════════════════════
```

---

## Key API endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Health check |
| `GET /token` | Verify FGA token acquisition |
| `GET /test-fga/:userId` | Raw FGA ListObjects result |
| `GET /userAssets/:userId` | PEP response — FGA + enriched data |
| `GET /userAssets-demo/:userId` | Same, HTML format for browser |
| `GET /subscription/:id` | Single subscription lookup |
| `GET /customer/:id` | Single customer lookup |
| `GET /reload-subscriptions` | Hot-reload subscriptions from disk |
| `GET /reload-customers` | Hot-reload customers from disk |

---

## `fgaClient` shim

`src/fga/fgaClient.js` is a **backward-compatibility shim** kept for existing callers.  New code should import directly:

```javascript
// ✅ Preferred
const authProvider     = require('./src/authorization');
const tuplePlanService = require('./src/authorization/tuplePlanService');
const assertionService = require('./src/authorization/assertionService');

// ⚠️  Legacy — still works
const fgaClient = require('./src/fga/fgaClient');
```

---

## Further documentation

| Document | Contents |
|----------|----------|
| [`src/authorization/README.md`](src/authorization/README.md) | FGA interface contract, method table, examples, adding new providers |
| [`src/authorization/auth0FgaProvider/README.md`](src/authorization/auth0FgaProvider/README.md) | Auth0 FGA implementation: env vars, token caching, caveats |
| [`src/data/README.md`](src/data/README.md) | Data Source interface contract, method table, examples, adding new providers |

---

## References

- [Auth0 Fine Grained Authorization Docs](https://fga.dev/)
- [PEP Pattern Overview](https://fga.dev/terminology#pep)
- [TMF OpenAPI Standards](https://www.openapis.org/)
- [Express.js Documentation](https://expressjs.com/)

---

## License

ISC

