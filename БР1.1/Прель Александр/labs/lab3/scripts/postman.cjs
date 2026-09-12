const { readConfig } = require('./config.cjs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const hw3 = path.resolve(__dirname, '../../../homeworks/hw3');
const warningOption = '--disable-warning=DEP0176';
const nodeOptions = [process.env.NODE_OPTIONS, warningOption].filter(Boolean).join(' ');
const child = spawn('npx', ['--yes', 'newman@6.2.2', 'run', path.join(hw3, 'restaurant-booking-dz3.postman_collection.json'),
  '-e', path.join(hw3, 'restaurant-booking-local.postman_environment.json'), '--env-var', `baseUrl=http://127.0.0.1:${readConfig().API_PORT}`,
  '--reporters', 'cli'], { stdio: 'inherit', env: { ...process.env, NODE_OPTIONS: nodeOptions } });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
