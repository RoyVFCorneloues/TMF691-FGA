const fs = require('fs');
const path = require('path');

let data = {};

function load() {
  const filePath = path.join(__dirname, '../data/tmfData.json');
  data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  console.log('✅ TMF data loaded');
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
