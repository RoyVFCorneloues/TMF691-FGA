const fs = require('fs');
const path = require('path');

let subscriptions = [];

function loadSubscriptions() {
  const filePath = path.join(__dirname, '../data/subscriptions.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  subscriptions = JSON.parse(data);
}

function findById(id) {
  return subscriptions.find(s => s.id === id);
}

function getAll() {
  return subscriptions;
}

module.exports = {
  loadSubscriptions,
  findById,
  getAll
};
