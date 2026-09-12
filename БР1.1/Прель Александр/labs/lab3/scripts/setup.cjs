const fs = require('node:fs');
const net = require('node:net');
const { randomBytes } = require('node:crypto');
const { configPath } = require('./config.cjs');
async function main() {
  if (fs.existsSync(configPath)) { console.log('.env.compose exists; preserved.'); return; }
  let port;
  for (let candidate = 8090; candidate < 8200; candidate++) {
    const free = await new Promise((resolve, reject) => {
      const server = net.createServer();
      server.once('error', error => error.code === 'EADDRINUSE' ? resolve(false) : reject(error));
      server.listen(candidate, '127.0.0.1', () => server.close(() => resolve(true)));
    });
    if (free) { port = candidate; break; }
  }
  if (!port) throw new Error('No free API port found');
  const values = { COMPOSE_PROJECT_NAME: `itmo-lab3-${randomBytes(6).toString('hex')}`, API_PORT: port,
    JWT_SECRET: randomBytes(32).toString('hex'), SERVICE_KEY: randomBytes(32).toString('hex'), RABBITMQ_PASSWORD: randomBytes(24).toString('hex') };
  values.IMAGE_PREFIX = values.COMPOSE_PROJECT_NAME;
  fs.writeFileSync(configPath, Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', { flag: 'wx', mode: 0o600 });
  console.log(`Created .env.compose with separate Compose volumes. API: http://127.0.0.1:${port}`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
