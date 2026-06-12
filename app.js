/**
 * =============================================================================
 * FGA PEP Proof-of-Concept API (Refactored)
 * -----------------------------------------------------------------------------
 * Responsibilities:
 *   - Define API endpoints
 *   - Delegate logic to services and repositories
 *
 * Architecture:
 *   app.js → service → FGA + repositories
 *
 * =============================================================================
 */

require('dotenv').config();

const express = require('express');

const app = express();
const port = 3000;

/**
 * =============================================================================
 * IMPORT MODULES
 * =============================================================================
 */

// Repositories (data access)
const subscriptionRepository = require('./src/repositories/subscriptionRepository');
const customerRepository = require('./src/repositories/customerRepository');

// Authorization provider (PDP) – selected via AUTH_PROVIDER env var (default: auth0)
const authProvider = require('./src/authorization');

// Service layer (PEP orchestration) – wired with the authorization provider
const { createUserAssetsService } = require('./src/services/userAssetsService');
const userAssetsService = createUserAssetsService(authProvider);

/**
 * =============================================================================
 * INITIALISE DATA SOURCES
 * =============================================================================
 */

subscriptionRepository.init();
customerRepository.init();

/**
 * =============================================================================
 * HEALTH CHECK
 * =============================================================================
 */
app.get('/', (req, res) => {
  res.send("FGA PEP API is running ✅");
});

/**
 * =============================================================================
 * TEST TOKEN (delegated to FGA client)
 * =============================================================================
 */
app.get('/token', async (req, res) => {
  try {
    // exposed via listUserObjects call (forces token fetch)
    const objects = await authProvider.listUserObjects("mr-b", "can_view", "subscription");

    res.json({
      message: "Token acquired successfully ✅",
      sample: objects
    });

  } catch (err) {
    res.status(500).json({
      error: err.response?.data || err.message
    });
  }
});

/**
 * =============================================================================
 * TEST FGA
 * =============================================================================
 */
app.get('/test-fga/:userId', async (req, res) => {
  try {
    const objects = await authProvider.listUserObjects(req.params.userId, 'can_view', 'subscription');
    res.json({ objects });

  } catch (err) {
    res.status(500).json({
      error: err.response?.data || err.message
    });
  }
});

/**
 * =============================================================================
 * SUBSCRIPTION LOOKUP (via repository)
 * =============================================================================
 */
app.get('/subscription/:id', (req, res) => {
  const sub = subscriptionRepository.findById(req.params.id);

  if (!sub) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json(sub);
});

/**
 * =============================================================================
 * CUSTOMER LOOKUP (via repository)
 * =============================================================================
 */
app.get('/customer/:id', (req, res) => {
  const customer = customerRepository.findById(req.params.id);

  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }

  res.json(customer);
});

/**
 * =============================================================================
 * MAIN PEP ENDPOINT
 * =============================================================================
 */
app.get('/userAssets/:userId', async (req, res) => {
  try {
    const userAssets = await userAssetsService.buildUserAssets(req.params.userId);

    res.json({ userAssets });

  } catch (err) {
    res.status(500).json({
      error: "Failed to retrieve user assets"
    });
  }
});

/**
 * =============================================================================
 * DEMO ENDPOINT (HTML FORMAT)
 * =============================================================================
 */
app.get('/userAssets-demo/:userId', async (req, res) => {
  try {
    const userAssets = await userAssetsService.buildUserAssets(req.params.userId);

    res.send(`
      <html>
        <head>
          <title>User Assets Demo</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            pre {
              background: #f4f4f4;
              padding: 15px;
              border-radius: 5px;
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
 * RELOAD DATA
 * =============================================================================
 */
app.get('/reload-subscriptions', (req, res) => {
  const count = subscriptionRepository.reloadSubscriptions();

  res.json({
    message: "Subscriptions reloaded ✅",
    count
  });
});

app.get('/reload-customers', (req, res) => {
  const count = customerRepository.reloadCustomers();

  res.json({
    message: "Customers reloaded ✅",
    count
  });
});

/**
 * =============================================================================
 * START SERVER
 * =============================================================================
 */
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
