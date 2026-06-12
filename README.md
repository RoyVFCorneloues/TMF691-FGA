> ⚠️ Proof of Concept – not production hardened

# FGA PEP Proof of Concept

## Overview

This project demonstrates a **Policy Enforcement Point (PEP)** pattern using Auth0 Fine Grained Authorization (FGA).

It retrieves authorised resources via FGA, enriches them with domain data, and returns a structured `userAssets` response without requiring OIDC userInfo.

**Key Features:**
- FGA-driven authorization (ListObjects)
- Multi-repository data abstraction (subscriptions, customers, TMF data)
- Tuple management with validation and dry-run support
- Service layer orchestration
- Demo endpoints for browser testing

---

## Architecture

```
Client Request
    ↓
GET /userAssets/{userId}
    ↓
PEP (this API)
    ├→ FGA ListObjects Query (policy decision)
    ├→ Data Enrichment (repositories)
    └→ Response Shape
    ↓
userAssets[] response
```

### Data Flow

| Component | Responsibility |
|-----------|-----------------|
| **FGA** | Determines which resources user can access |
| **PEP** | Orchestrates calls, enriches data, shapes response |
| **Data Provider (PIP)** | Pluggable data-source abstraction (subscriptions, customers, TMF data) |
| **Services** | Business logic (user assets, tuple building) |

---

## Project Structure

```
.
├── app.js                              # Main Express application & endpoints
├── package.json                        # Dependencies
├── src/
│   ├── authorization/
│   │   ├── authorizationProvider.js   # Authorization provider interface (PDP)
│   │   ├── auth0FgaProvider.js        # Auth0 FGA implementation
│   │   └── index.js                   # Auth provider factory (AUTH_PROVIDER)
│   ├── data/
│   │   ├── dataSourceProvider.js      # Data-source provider interface (PIP)
│   │   ├── jsonFileProvider.js        # JSON-file-backed implementation
│   │   ├── index.js                   # Data provider factory (DATA_PROVIDER)
│   │   ├── subscriptions.json         # Mock subscription records
│   │   ├── customers.json             # Mock customer/party records
│   │   └── tmfData.json               # TMF domain model (accounts, roles, subscriptions)
│   ├── fga/
│   │   └── fgaClient.js               # Backward-compat shim (delegates to authorization/)
│   ├── services/
│   │   ├── userAssetsService.js       # Orchestrate user assets retrieval
│   │   └── tupleTMFBuilderService.js  # Generate FGA tuples from TMF data
│   └── repositories/
│       ├── subscriptionRepository.js  # Subscription JSON file repository
│       ├── customerRepository.js      # Customer/party JSON file repository
│       └── tmfRepository.js           # TMF domain model JSON file repository
├── .gitignore                          # Ignore node_modules and .env
└── README.md                           # This file
```

---

## Core Concepts

### 1. Policy Enforcement Point (PEP)

The API acts as a PEP by:
- **Delegating authorization** to FGA (policy decision)
- **Enriching responses** with business data
- **Shaping responses** according to API contract

### 2. External Data Sources

For demonstration purposes, data is stored in external JSON files:

**subscriptions.json** – Product subscriptions with account relationships
```json
[
  {
    "id": "S1",
    "accountId": "A1",
    "product": "Mobile Plan"
  }
]
```

**customers.json** – Parties/customers with account relationships
```json
[
  {
    "id": "mr-b",
    "name": "Mr B",
    "accounts": ["A1", "A2"]
  }
]
```

**tmfData.json** – TMF domain model for tuple generation
```json
{
  "party": [...],
  "account": [...],
  "partyRole": [...],
  "subscription": [...]
}
```

### 3. Tuple Management

FGA relationships are managed via **tuple plans** (write/delete operations):

```javascript
{
  "write": [
    { "user": "user:mr-b", "relation": "owner", "object": "account:A1" },
    { "user": "account:A1", "relation": "parent", "object": "subscription:S1" }
  ],
  "delete": []
}
```

Tuples are:
- **Validated** before writing (checks existence)
- **Loadable from files** for bulk operations
- **Testable via dry-run** before commitment

---

## Endpoints

### Health Check
```
GET /
```
Returns: `FGA PEP API is running ✅`

---

### Token Test
```
GET /token
```
Fetches and returns an access token for FGA API calls.

Returns:
```json
{
  "message": "Token acquired successfully ✅",
  "sample": ["subscription:S1", "subscription:S2"]
}
```

---

### FGA Query Test
```
GET /test-fga/{userId}
```
Queries FGA directly to show which subscriptions a user can view.

Example:
```
GET /test-fga/mr-b
```

Returns:
```json
{
  "objects": ["subscription:S1", "subscription:S2", "subscription:S3"]
}
```

---

### Subscription Lookup
```
GET /subscription/{id}
```
Retrieves a subscription by ID from the repository.

Example:
```
GET /subscription/S1
```

Returns:
```json
{
  "id": "S1",
  "accountId": "A1",
  "product": "Mobile Plan"
}
```

---

### Customer Lookup
```
GET /customer/{id}
```
Retrieves a customer/party by ID from the repository.

Example:
```
GET /customer/mr-b
```

Returns:
```json
{
  "id": "mr-b",
  "name": "Mr B",
  "accounts": ["A1", "A2"]
}
```

---

### Core PEP Endpoint: User Assets
```
GET /userAssets/{userId}
```
Main endpoint that orchestrates FGA authorization + data enrichment.

**Flow:**
1. Calls FGA to get authorized subscriptions
2. Enriches each subscription with product details
3. Returns structured `userAssets[]` response

Example:
```
GET /userAssets/mr-b
```

Returns:
```json
{
  "userAssets": [
    {
      "id": "S1",
      "entityType": "subscription",
      "accountId": "A1",
      "product": "Mobile Plan",
      "entitlements": ["can_view"]
    },
    {
      "id": "S2",
      "entityType": "subscription",
      "accountId": "A1",
      "product": "Broadband",
      "entitlements": ["can_view"]
    }
  ]
}
```

---

### Demo Endpoint: User Assets (HTML Format)
```
GET /userAssets-demo/{userId}
```
Same as `/userAssets` but returns formatted HTML for browser viewing.

Example:
```
GET /userAssets-demo/mr-b
```

---

### Data Management: Reload Subscriptions
```
GET /reload-subscriptions
```
Explicitly reloads subscription data from disk without restarting the server.

Returns:
```json
{
  "message": "Subscriptions reloaded ✅",
  "count": 5
}
```

**Note:** File watching is enabled by default, so changes to `subscriptions.json` are automatically detected.

---

### Data Management: Reload Customers
```
GET /reload-customers
```
Explicitly reloads customer data from disk without restarting the server.

Returns:
```json
{
  "message": "Customers reloaded ✅",
  "count": 3
}
```

**Note:** File watching is enabled by default, so changes to `customers.json` are automatically detected.

---

## Demo Walkthrough

Try this sequence to explore the API:

1. **Fetch a token:**
   ```bash
   curl http://localhost:3000/token
   ```

2. **Query FGA directly:**
   ```bash
   curl http://localhost:3000/test-fga/mr-b
   ```

3. **Get enriched user assets:**
   ```bash
   curl http://localhost:3000/userAssets/mr-b
   ```

4. **View in browser (demo format):**
   ```
   http://localhost:3000/userAssets-demo/mr-b
   ```

---

## Setup

### Prerequisites
- Node.js 14+
- Auth0 FGA account (free tier available at [auth0.com/fine-grained-authorization](https://auth0.com/fine-grained-authorization))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/RoyVFCorneloues/TMF691-FGA.git
   cd TMF691-FGA
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (see below)

4. Run the server:
   ```bash
   node app.js
   ```

Server will start on `http://localhost:3000`

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Auth0 FGA Configuration
FGA_API_URL=https://api.eu1.fga.dev
FGA_STORE_ID=your_store_id
FGA_MODEL_ID=your_model_id
FGA_CLIENT_ID=your_client_id
FGA_CLIENT_SECRET=your_client_secret
```

### Where to Find These Values

1. Log in to [Auth0 Dashboard](https://dashboard.auth0.com)
2. Navigate to **Fine Grained Authorization**
3. Create a store (if not already created)
4. Select your store and go to **Settings**
5. Copy the Store ID and Model ID
6. Create an API client for machine-to-machine access
7. Copy the Client ID and Client Secret

### Important Security Notes

- **Never commit `.env` to version control** (already in `.gitignore`)
- Rotate secrets if exposed
- Use secure secret management in production (e.g., HashiCorp Vault, AWS Secrets Manager, GitHub Actions secrets)

---

## FGA Client Features

The `fgaClient` module provides:

### Authorization Queries
- **listObjects(userId, relation, type)** – Query FGA ListObjects endpoint
- **getUserSubscriptions(userId)** – Convenience method for subscription queries

### Tuple Management
- **readTuple(tuple)** – Query existing tuples
- **tupleExists(tuple)** – Check if a tuple exists before writing
- **writeTupleBatch({ writes, deletes })** – Batch write/delete operations
- **processTuplePlan(plan, { dryRun })** – Validate and apply a tuple plan
- **loadTuplePlanFromFile(path)** – Load tuple plans from JSON files
- **processTuplePlanFromFile(path, { dryRun })** – Load and process tuple plans

### Token Management
- Automatic token caching with expiry handling
- Prevents unnecessary token requests

---

## Data Source Provider (PIP)

The data-source layer is **pluggable**, mirroring the authorization provider approach.  All data access goes through a `DataSourceProvider` interface so the backing store can be swapped without touching services or endpoints.

### Configuration

Set the `DATA_PROVIDER` environment variable (default: `json`):

```bash
DATA_PROVIDER=json       # JSON file-backed provider (default, PoC)
DATA_PROVIDER=tmf_api    # Future: real TMF Product/Party APIs
```

### Provider Interface (`src/data/dataSourceProvider.js`)

Every provider must implement the following methods:

| Method | Description |
|--------|-------------|
| `init()` | Initialise all data sources (called once at startup) |
| `findSubscriptionById(id)` | Subscription lookup by ID |
| `findSubscriptionsByAccountId(accountId)` | All subscriptions for an account |
| `getAllSubscriptions()` | Full subscription dataset |
| `reloadSubscriptions()` | Reload subscriptions; returns record count |
| `findCustomerById(id)` | Customer/party lookup by ID |
| `getAllCustomers()` | Full customer dataset |
| `reloadCustomers()` | Reload customers; returns record count |
| `getTmfAccounts()` | TMF account records |
| `getTmfSubscriptions()` | TMF subscription records |
| `getTmfRoles()` | TMF party-role records |

### Built-in Providers

#### `json` (default) – `src/data/jsonFileProvider.js`

Reads data from local JSON files in `src/data/`.  Used for PoC and local development.

```bash
DATA_PROVIDER=json  # or leave unset
```

### Adding a New Provider

1. Create `src/data/myProvider.js` that extends `DataSourceProvider`:

```javascript
const DataSourceProvider = require('./dataSourceProvider');

class MyProvider extends DataSourceProvider {
  init() { /* connect to your API */ }
  findSubscriptionById(id) { /* call TMF API */ }
  // ... implement all required methods
}

module.exports = MyProvider;
```

2. Register it in the factory (`src/data/index.js`):

```javascript
const MyProvider = require('./myProvider');

switch (name) {
  case 'json':   return new JsonFileProvider();
  case 'my_api': return new MyProvider();
  // ...
}
```

3. Set the environment variable:

```bash
DATA_PROVIDER=my_api
```

### Using the Provider

```javascript
const dataProvider = require('./src/data');

// Initialise at startup
dataProvider.init();

// Use in routes / services
const sub      = dataProvider.findSubscriptionById('S1');
const customer = dataProvider.findCustomerById('mr-b');
const accounts = dataProvider.getTmfAccounts();
```

### Dependency Injection in Services

Services receive the provider via their factory function, making them testable with any mock:

```javascript
const { createUserAssetsService } = require('./src/services/userAssetsService');

// Production wiring
const authProvider = require('./src/authorization');
const dataProvider = require('./src/data');
const service = createUserAssetsService(authProvider, dataProvider);

// Test wiring (mock providers)
const mockDataProvider = { findSubscriptionById: (id) => ({ id, product: 'Test' }) };
const testService = createUserAssetsService(mockAuthProvider, mockDataProvider);
```

---

## Data Repositories

The underlying repositories (`src/repositories/`) are used internally by `JsonFileProvider`.  Direct usage is discouraged in favour of going through the data provider.

### Subscription Repository
```javascript
subscriptionRepository.init()           // Load and watch subscriptions.json
subscriptionRepository.findById(id)     // Get subscription by ID
subscriptionRepository.findByAccountId(accountId)  // Get all subscriptions for an account
subscriptionRepository.getAll()         // Get all subscriptions
subscriptionRepository.reloadSubscriptions()  // Explicit reload
```

### Customer Repository
```javascript
customerRepository.init()               // Load and watch customers.json
customerRepository.findById(id)         // Get customer by ID
customerRepository.getAll()             // Get all customers
customerRepository.reloadCustomers()    // Explicit reload
```

### TMF Repository
```javascript
tmfRepository.load()                    // Load tmfData.json
tmfRepository.getAccounts()             // Get account records
tmfRepository.getSubscriptions()        // Get subscription records
tmfRepository.getRoles()                // Get party role records
```

---

## Services

### User Assets Service
Orchestrates FGA authorization + data enrichment:

```javascript
const userAssets = await userAssetsService.buildUserAssets(userId);
```

**Process:**
1. Calls FGA to get authorized subscriptions
2. Maps object IDs to subscription details
3. Filters out missing subscriptions
4. Returns enriched `userAssets[]`

### Tuple TMF Builder Service
Generates FGA tuples from TMF domain model:

```javascript
const tuples = tupleTMFBuilderService.buildTuples();
```

**Tuple Types Generated:**
- **Account → Subscription (parent):** `account:A1 parent subscription:S1`
- **User → Account (role):** `user:mr-b owner account:A1`

---

## Future Enhancements

When moving to production:

1. **Authorization & Security**
   - Input validation on all endpoints
   - Authentication middleware (e.g., JWT verification)
   - Rate limiting and request throttling
   - Audit logging for authorization decisions

2. **Observability**
   - Structured logging (JSON format with correlation IDs)
   - Metrics collection (Prometheus-compatible)
   - Distributed tracing support
   - Health check endpoints

3. **Data Management**
   - Replace mock JSON data with real TMF APIs (Product, Service, Inventory)
   - Implement subscription caching with TTL
   - Add pagination support for large datasets
   - Connection pooling for external APIs

4. **Testing**
   - Unit tests for repositories and services
   - Integration tests for FGA interactions
   - Mock FGA server for CI/CD pipelines
   - End-to-end workflow tests

5. **Performance**
   - Query result caching
   - Batch operations optimization
   - Connection reuse and pooling
   - Database indexes for lookups

6. **API Design**
   - OpenAPI/Swagger documentation
   - API versioning strategy
   - Proper HTTP status codes and error handling
   - Request/response validation schemas

7. **Deployment**
   - Docker containerization
   - Kubernetes manifests
   - Environment-specific configuration
   - CI/CD pipeline integration

---

## Summary

This PoC demonstrates:

- **Relationship-based access control** using Auth0 Fine Grained Authorization
- **Separation of concerns** between authorization (FGA) and data enrichment (PEP)
- **Scalable PEP orchestration** pattern for TMF-based systems
- **Flexible data abstraction** supporting easy integration with real APIs
- **Tuple management** workflows for maintaining authorization relationships

The modular architecture makes it straightforward to evolve this into a production system by:
- Adding validation and security layers
- Replacing mock data with real API integrations
- Implementing proper observability
- Adding comprehensive test coverage

---

## References

- [Auth0 Fine Grained Authorization Docs](https://fga.dev/)
- [PEP Pattern Overview](https://fga.dev/terminology#pep)
- [TMF OpenAPI Standards](https://www.openapis.org/)
- [Express.js Documentation](https://expressjs.com/)

---

## License

ISC

