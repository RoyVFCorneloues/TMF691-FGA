const fs = require('fs');
const path = require('path');

let data = {};

function load(sourceFile = null) {
  // Allow override via parameter, environment variable, or default
  const source = sourceFile || process.env.TMF_DATA_SOURCE || 'tmfData.json';
  const filePath = path.join(__dirname, '../data', source);
  
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`✅ TMF data loaded from: ${source}`);
  } catch (error) {
    console.error(`❌ Error loading TMF data from ${source}:`, error.message);
    throw error;
  }
}

function getAccounts() {
  return data.account || [];
}

function getSubscriptions() {
  return data.subscription || [];
}

function getRoles() {
  return data.partyRole || [];
}

module.exports = {
  load,
  getAccounts,
  getSubscriptions,
  getRoles
};
