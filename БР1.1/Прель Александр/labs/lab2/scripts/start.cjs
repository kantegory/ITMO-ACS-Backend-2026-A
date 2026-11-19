const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const root = path.join(__dirname, '..');
const messaging = process.env.MESSAGING_ENABLED === 'true';
const services = ['accounts', 'catalog', 'bookings', 'gateway', ...(messaging ? ['notifications'] : [])];
const ports = services.map((name, index) => Number(process.env[`${name.toUpperCase()}_PORT`] ?? [8081, 8082, 8083, 8080, 8084][index]));
if (new Set(ports).size !== services.length || ports.some(port => !Number.isInteger(port) || port < 1 || port > 65535)) {
  throw new Error('Service ports must be valid and distinct');
}
const databases = ['ACCOUNTS', 'CATALOG', 'BOOKINGS', ...(messaging ? ['NOTIFICATIONS'] : [])].map(name => {
  const value = process.env[`${name}_DATABASE_PATH`];
  if (!value) throw new Error('Missing database configuration. Run npm run setup.');
  const file = path.resolve(root, value);
  return fs.existsSync(file) ? fs.realpathSync(file) : file;
});
if (new Set(databases).size !== databases.length) throw new Error('Each service must have a separate database');
for (const name of services) {
  if (!fs.existsSync(path.join(root, 'dist', name, 'index.js'))) throw new Error('Build is missing. Run npm run build.');
}
const children = [];
let stopping = false;
const stop = (code = 0) => {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) if (child.exitCode === null) child.kill('SIGTERM');
  setTimeout(() => {
    for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  }, 10000).unref();
};
for (const name of services) {
  const child = spawn(process.execPath, [path.join(root, 'dist', name, 'index.js')], { cwd: root, env: process.env, stdio: 'inherit' });
  children.push(child);
  child.once('error', error => { console.error(`${name}: ${error.message}`); stop(1); });
  child.once('exit', code => { if (!stopping) { console.error(`${name} exited (${code}); stopping this stack.`); stop(1); } });
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
