const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

if (fs.existsSync(dataDir)) {
  for (const file of fs.readdirSync(dataDir)) {
    if (file.endsWith('.sqlite')) {
      fs.unlinkSync(path.join(dataDir, file));
    }
  }
}

console.log('SQLite database files were removed');
