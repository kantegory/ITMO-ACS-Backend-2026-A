const fs = require('node:fs');
const net = require('node:net');
const { spawnSync } = require('node:child_process');
const bundled = '/Applications/Docker.app/Contents/Resources/bin';
const binary = fs.existsSync(`${bundled}/docker`) ? `${bundled}/docker` : 'docker';
const image = 'rabbitmq:4.3.5-management@sha256:8cbda4973b3053f3e3f76f4c28edcad1802896aec5a6e781ebc23bf1eb8273aa';

function docker(args, options = {}) {
  const result = spawnSync(binary, args, { encoding: 'utf8', timeout: 180000,
    ...options, env: { ...process.env, PATH: `${bundled}:${process.env.PATH}`, ...options.env } });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Docker ${args[0]} failed: ${result.stderr || result.stdout}`);
  return result.stdout?.trim() ?? '';
}
async function freePorts(count) {
  const listeners = [];
  try {
    for (let i = 0; i < count; i++) {
      const listener = net.createServer();
      listeners.push(listener);
      await new Promise((resolve, reject) => { listener.once('error', reject); listener.listen(0, '127.0.0.1', resolve); });
    }
    return listeners.map(listener => listener.address().port);
  } finally {
    await Promise.all(listeners.map(listener => new Promise(resolve => listener.close(resolve))));
  }
}
module.exports = { docker, image, freePorts };
