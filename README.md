> ⚠️ Proof of Concept – not production hardened

# FGA PEP Proof of Concept

## Overview

This project demonstrates a **Policy Enforcement Point (PEP)** pattern using Auth0 Fine Grained Authorization (FGA).

It retrieves authorised resources via FGA, enriches them with domain data, and returns a structured `userAssets` response.

## Demo Walkthrough

1. `Call /token`
2. `Call /test-fga/mr-b`
3. `Call /userAssets/mr-b`
4. `Call /userAssets-demo/mr-b`

---

## Architecture
```
Client Request
↓
GET /userAssets/{userId}
↓
PEP (this API)
↓
FGA (ListObjects)
↓
Authorised Resource IDs
↓
Data Enrichment (mock subscriptions)
↓
userAssets[] response
```

---

## External Data Source (Subscriptions)

For demonstration purposes, subscription data is no longer hardcoded in the application.

Instead, it is stored in an external file:

subscriptions.json

Example:

```json
[
  {
    "id": "S1",
    "accountId": "A1",
    "product": "Mobile Plan"
  },
  {
    "id": "S2",
    "accountId": "A1",
    "product": "Broadband"
  }
]
```
---

## Key Concept

| Layer | Responsibility |
|------|----------------|
| FGA | Determines which resources are accessible |
| PEP | Enriches and shapes the response |
| Data Layer | Provides domain data (subscriptions) |

---

## Endpoints

### Health Check
`GET /`

Returns:
FGA PEP API is running ✅

---

### Token Test
`GET /token`

Returns:
```json
{
  "token": "<access_token>"
}
```

---

### FGA Test
`GET /test-fga/{userId}`

Returns:
```json
{
  "objects": [
    "subscription:S1",
    "subscription:S2"
  ]
}
```

---

### Subscription Lookup
`GET /subscription/{id}`

Returns:
```json
{
  "id": "S1",
  "accountId": "A1",
  "product": "Mobile Plan"
}
```

---

### Core PEP Endpoint
`GET /userAssets/{userId}`

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
    }
  ]
}
```

---

### Demo Endpoint
`GET /userAssets-demo/{userId}`

Returns formatted HTML for browser viewing.

---

## Flow

1. Client calls:
   GET /userAssets/mr-b

2. PEP calls FGA:
   `ListObjects(user, relation=can_view, type=subscription)`

3. FGA returns:
   `["subscription:S1", "subscription:S2"]`

4. API enriches via subscription data

5. API returns structured response

---

## Setup

Install dependencies:
`npm install`

Run:
`node app.js`

---

## Environment Variables

Create a `.env` file:

```
FGA_API_URL=https://api.eu1.fga.dev  
FGA_STORE_ID=YOUR_STORE_ID  
FGA_MODEL_ID=YOUR_MODEL_ID  
FGA_CLIENT_ID=YOUR_CLIENT_ID  
FGA_CLIENT_SECRET=YOUR_CLIENT_SECRET  
```

---

## Security Notes

- Do not commit `.env`
- Rotate secrets if exposed
- Use secure storage in production (e.g. vaults or GitHub secrets)

---

## Future Enhancements

- Role-aware entitlements (owner/admin/collector)
- Config-driven mapping (templates + JSONPath)
- Replace mock data with real APIs
- Token caching
- OpenAPI documentation

---

## Summary

This POC demonstrates:

- Relationship-based access control using FGA
- Separation of authorisation and data layers
- Scalable PEP orchestration pattern
