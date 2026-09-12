const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { randomBytes } = require('node:crypto');

async function selectPorts() {
  const ports = [];
  for (let candidate = 8080; candidate < 8180 && ports.length < 5; candidate++) {
    const free = await new Promise((resolve, reject) => {
      const server = net.createServer();
      server.once('error', error => error.code === 'EADDRINUSE' ? resolve(false) : reject(error));
      server.listen(candidate, '127.0.0.1', () => server.close(() => resolve(true)));
    });
    if (free) ports.push(candidate);
  }
  if (ports.length !== 5) throw new Error('Five free API ports are required');
  return ports;
}
async function main() {
  const target = path.resolve(__dirname, '..', '.env.hw5');
  if (fs.existsSync(target)) { console.log('.env.hw5 exists; preserved.'); return; }
  const ports = await selectPorts();
  const id = randomBytes(6).toString('hex');
  const values = { MESSAGING_ENABLED: 'true', JWT_SECRET: randomBytes(32).toString('hex'), SERVICE_KEY: randomBytes(32).toString('hex'),
    RABBITMQ_USER: 'itmo', RABBITMQ_PASSWORD: randomBytes(24).toString('hex'), RABBITMQ_VHOST: 'itmo',
    RABBITMQ_CONTAINER: `itmo-hw5-${id}`, RABBITMQ_NAMESPACE: `itmo.${id}` };
  ['GATEWAY', 'ACCOUNTS', 'CATALOG', 'BOOKINGS', 'NOTIFICATIONS'].forEach((name, index) => {
    values[`${name}_PORT`] = ports[index];
    if (name !== 'GATEWAY') values[`${name}_DATABASE_PATH`] = `./data/hw5-${id}/${name.toLowerCase()}.sqlite`;
  });
  // broker.cjs selects free loopback ports and records the connection after creation.
  fs.writeFileSync(target, Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', { flag: 'wx', mode: 0o600 });
  console.log(`Created .env.hw5. API will use http://127.0.0.1:${ports[0]}`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
