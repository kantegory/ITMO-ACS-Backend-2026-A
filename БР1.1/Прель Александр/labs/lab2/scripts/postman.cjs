const path = require('node:path');
const { spawn } = require('node:child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const hw3 = path.resolve(__dirname, '../../../homeworks/hw3');
const baseUrl = process.env.BASE_URL ?? `http://127.0.0.1:${process.env.GATEWAY_PORT ?? 8080}`;
const url = new URL(baseUrl);
if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname)) throw new Error('Only local API targets are allowed');
const warningOption = '--disable-warning=DEP0176';
const nodeOptions = [process.env.NODE_OPTIONS, warningOption].filter(Boolean).join(' ');
const child = spawn('npx', ['--yes', 'newman@6.2.2', 'run', path.join(hw3, 'restaurant-booking-dz3.postman_collection.json'),
  '-e', path.join(hw3, 'restaurant-booking-local.postman_environment.json'), '--env-var', `baseUrl=${baseUrl}`, '--reporters', 'cli'],
{ stdio: 'inherit', env: { ...process.env, NODE_OPTIONS: nodeOptions } });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
