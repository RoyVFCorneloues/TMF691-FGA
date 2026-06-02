/**
 * =============================================================================
 * FGA PEP Proof-of-Concept API
 * -----------------------------------------------------------------------------
 * This service demonstrates a Policy Enforcement Point (PEP) pattern:
 *
 * 1. Receives a user request (party/user ID)
 * 2. Calls FGA (Policy Decision Point) to retrieve authorised resources
 * 3. Enriches those resources with local data (mock TMF dataset)
 * 4. Returns structured `userAssets` response
 *
 * =============================================================================
 */

require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

/**
 * =============================================================================
 * MOCK DATA (Simulating TMF or backend system)
 * -----------------------------------------------------------------------------
 * In a real implementation, this would be replaced with:
 * - TMF APIs
 * - Data services
 * - Domain-specific microservices
 * =============================================================================
 */
const subscriptions = [
  { id: "S1", accountId: "A1", product: "Mobile Plan" },
  { id: "S2", accountId: "A1", product: "Broadband" },
  { id: "S3", accountId: "A1", product: "SIM Only" },
  { id: "S4", accountId: "A2", product: "Family Plan" },
  { id: "S5", accountId: "A3", product: "Data Plan" }
];

/**
 * =============================================================================
 * HEALTH CHECK ENDPOINT
 * -----------------------------------------------------------------------------
 * Simple endpoint to confirm API is running
 *
 * GET /
 *
 * Returns:
 *   String message
 * =============================================================================
 */
app.get('/', (req, res) => {
  res.send("FGA PEP API is running ✅");
});

/**
 * =============================================================================
 * GET FGA ACCESS TOKEN
 * -----------------------------------------------------------------------------
 * Exchanges client credentials for an OAuth access token used to call FGA APIs
 *
 * Requires:
 *   - FGA_CLIENT_ID
 *   - FGA_CLIENT_SECRET
 *
 * Returns:
 *   String access token
 * =============================================================================
 */
async function getToken() {
  try {
    const response = await axios.post(
      'https://auth.fga.dev/oauth/token',
      {
        client_id: process.env.FGA_CLIENT_ID,
        client_secret: process.env.FGA_CLIENT_SECRET,
        audience: "https://api.eu1.fga.dev/",
        grant_type: "client_credentials"
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    return response.data.access_token;

  } catch (error) {
    console.error("❌ Token Error:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * =============================================================================
 * TEST TOKEN ENDPOINT
 * -----------------------------------------------------------------------------
 * Used for debugging authentication with FGA
 *
 * GET /token
 *
 * Returns:
 *   { token: "<access_token>" }
 * =============================================================================
 */
app.get('/token', async (req, res) => {
  try {
    const token = await getToken();
    res.json({ token });
  } catch (err) {
    res.status(500).json({
      error: err.response?.data || err.message
    });
  }
});

/**
 * =============================================================================
 * GET AUTHORISED SUBSCRIPTIONS FROM FGA
 * -----------------------------------------------------------------------------
 * Calls FGA ListObjects API to retrieve all subscriptions a user can view
 *
 * @param {string} userId - The user (party) identifier
 *
 * Returns:
 *   Array of strings (e.g. ["subscription:S1", "subscription:S2"])
 * =============================================================================
 */
async function getSubscriptions(userId) {
  const token = await getToken();

  const response = await axios.post(
    `${process.env.FGA_API_URL}/stores/${process.env.FGA_STORE_ID}/list-objects`,
    {
      user: `user:${userId}`,
      relation: "can_view",
      type: "subscription",
      authorization_model_id: process.env.FGA_MODEL_ID
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.objects;
}

/**
 * =============================================================================
 * TEST FGA ENDPOINT
 * -----------------------------------------------------------------------------
 * Debug endpoint to verify FGA integration
 *
 * GET /test-fga/{userId}
 *
 * Returns:
 *   { objects: ["subscription:S1", ...] }
 * =============================================================================
 */
app.get('/test-fga/:userId', async (req, res) => {
  try {
    const objects = await getSubscriptions(req.params.userId);
    res.json({ objects });
  } catch (err) {
    console.error("FGA ERROR:", err.response?.data || err.message);
    res.status(500).json({
      error: err.response?.data || err.message
    });
  }
});

/**
 * =============================================================================
 * GET SUBSCRIPTION BY ID
 * -----------------------------------------------------------------------------
 * Mock endpoint representing a backend service
 *
 * GET /subscription/{id}
 *
 * Returns:
 *   Subscription object or 404
 * =============================================================================
 */
app.get('/subscription/:id', (req, res) => {
  const sub = subscriptions.find(s => s.id === req.params.id);

  if (!sub) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json(sub);
});

/**
 * ============================================================================
 * BUILD USER ASSETS (CORE LOGIC)
 * ----------------------------------------------------------------------------
 * Central reusable function used by both API and demo endpoints
 *
 * @param {string} userId
 * @returns {Array} userAssets[]
 * ============================================================================
 */
async function buildUserAssets(userId) {
  const objects = await getSubscriptions(userId);

  const userAssets = objects
    .map(obj => {
      const [type, id] = obj.split(":");

      const sub = subscriptions.find(s => s.id === id);
      if (!sub) return null;

      return {
        id: sub.id,
        entityType: type,
        accountId: sub.accountId,
        product: sub.product,
        entitlements: ["can_view"]
      };
    })
    .filter(Boolean);

  return userAssets;
}

/**
 * ============================================================================
 * DEMO ENDPOINT (STRINGIFIED OUTPUT)
 * ----------------------------------------------------------------------------
 * Wraps the core userAssets endpoint and returns formatted output
 * for browser/demo purposes
 *
 * GET /userAssets-demo/{userId}
 *
 * Returns:
 *   Pretty-formatted JSON inside HTML
 * ============================================================================
 */
app.get('/userAssets-demo/:userId', async (req, res) => {
  try {
    const userAssets = await buildUserAssets(req.params.userId);

    res.send(`
      <html>
        <head>
          <title>User Assets Demo</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            h1 { color: #333; }
            pre {
              background: #f4f4f4;
              padding: 15px;
              border-radius: 5px;
              overflow-x: auto;
            }
          </style>
        </head>
        <body>
          <h1>User Assets for ${req.params.userId}</h1>
          <pre>${JSON.stringify(userAssets, null, 2)}</pre>
        </body>
      </html>
    `);

  } catch (err) {
    res.status(500).send("Failed to render demo output");
  }
});

/**
 * =============================================================================
 * MAIN PEP ENDPOINT: USER ASSETS
 * -----------------------------------------------------------------------------
 * Orchestrates the full PEP flow:
 *
 * 1. Calls FGA to retrieve authorised subscriptions
 * 2. Maps FGA resource IDs to internal data
 * 3. Transforms results into userAssets structure
 *
 * GET /userAssets/{userId}
 *
 * Parameters:
 *   userId (path) - user/party identifier
 *
 * Returns:
 *   {
 *     userAssets: [
 *       {
 *         id,
 *         entityType,
 *         accountId,
 *         product,
 *         entitlements[]
 *       }
 *     ]
 *   }
 * =============================================================================
 */
app.get('/userAssets/:userId', async (req, res) => {
  try {
    const userAssets = await buildUserAssets(req.params.userId);

    res.json({ userAssets });

  } catch (err) {
    res.status(500).json({
      error: "Failed to retrieve user assets"
    });
  }
});

/**
 * =============================================================================
 * START SERVER
 * =============================================================================
 */
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});