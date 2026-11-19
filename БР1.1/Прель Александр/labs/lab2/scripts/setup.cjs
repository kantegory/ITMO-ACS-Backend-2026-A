const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { randomBytes } = require('node:crypto');

async function main() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) { console.log('.env already exists; kept unchanged.'); return; }
  const ports = [];
  for (let candidate = 8080; ports.length < 4 && candidate < 8180; candidate++) {
    const free = await new Promise((resolve, reject) => {
      const server = net.createServer();
      server.once('error', error => error.code === 'EADDRINUSE' ? resolve(false) : reject(error));
      server.listen(candidate, '127.0.0.1', () => server.close(() => resolve(true)));
    });
    if (free) ports.push(candidate);
  }
  if (ports.length < 4) throw new Error('Could not find four available local ports');
  const directory = './data/local-' + randomBytes(6).toString('hex');
  const values = {
    GATEWAY_PORT: ports[0], ACCOUNTS_PORT: ports[1], CATALOG_PORT: ports[2], BOOKINGS_PORT: ports[3],
    ACCOUNTS_DATABASE_PATH: `${directory}/accounts.sqlite`, CATALOG_DATABASE_PATH: `${directory}/catalog.sqlite`,
    BOOKINGS_DATABASE_PATH: `${directory}/bookings.sqlite`, JWT_SECRET: randomBytes(32).toString('hex'),
    SERVICE_KEY: randomBytes(32).toString('hex'),
  };
  fs.writeFileSync(envPath, Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', { flag: 'wx', mode: 0o600 });
  console.log(`Created .env with fresh database paths. API: http://127.0.0.1:${ports[0]}`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
