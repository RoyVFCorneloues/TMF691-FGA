require('dotenv').config();

const fs = require('fs');
const path = require('path');

const tmfRepository = require('../src/repositories/tmfRepository');
const tupleBuilder = require('../src/services/tupleTMFBuilderService');

function run() {
  tmfRepository.load();

  const tuples = tupleBuilder.buildTuples();

  const outputPath = path.join(
    __dirname,
    '../src/relationships/tuples-TMF.json'
  );

  fs.writeFileSync(outputPath, JSON.stringify(tuples, null, 2));

  console.log('✅ Tuples generated:', outputPath);
}

run();
