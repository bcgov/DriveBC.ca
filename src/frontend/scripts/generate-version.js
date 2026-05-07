const fs = require('fs');
const path = require('path');

const version = {
  version: new Date().toISOString(),
};

// IMPORTANT: output to build folder (not src)
const outputPath = path.join(__dirname, '../public/version.json');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(version, null, 2));

console.log('version.json generated');