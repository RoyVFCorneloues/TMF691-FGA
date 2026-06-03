const path = require('path');
const fgaClient = require('../src/fga/fgaClient');

require('dotenv').config();

async function run() {
  const file = process.argv[2] || 'tuples.json';
  const dryRun = process.argv.includes('--dry-run');

  const filePath = path.join(__dirname, `../src/relationships/${file}`);

  console.log(`\n🚀 Processing: ${file}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'APPLY'}\n`);

  try {
    const result = await fgaClient.processTuplePlanFromFile(filePath, {
      dryRun
    });

    console.log('✅ Result:');
    console.log(JSON.stringify(result, null, 2));

  } catch (err) {
    console.error('❌ ERROR:');
    console.error(err.message);
    console.error(err.details || '');
  }
}

run();
