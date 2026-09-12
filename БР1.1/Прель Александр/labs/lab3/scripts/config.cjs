const fs = require('node:fs');
const path = require('node:path');
const { parseEnv } = require('node:util');
const root = path.resolve(__dirname, '..');
const configPath = path.join(root, '.env.compose');
const bundled = '/Applications/Docker.app/Contents/Resources/bin';
const binary = fs.existsSync(`${bundled}/docker`) ? `${bundled}/docker` : 'docker';
function readConfig(file = configPath) {
  const config = parseEnv(fs.readFileSync(file, 'utf8'));
  if (!/^itmo-lab3-(?:test-)?[a-f0-9]{12}$/.test(config.COMPOSE_PROJECT_NAME ?? '')) throw new Error('Unexpected Compose project name');
  if (!/^itmo-lab3-[a-f0-9]{12}$/.test(config.IMAGE_PREFIX ?? '')) throw new Error('Invalid image prefix');
  if (!/^\d+$/.test(config.API_PORT ?? '') || Number(config.API_PORT) < 1024 || Number(config.API_PORT) > 65535) throw new Error('Invalid API_PORT');
  for (const key of ['JWT_SECRET', 'SERVICE_KEY', 'RABBITMQ_PASSWORD']) {
    if (!/^[a-f0-9]{48,64}$/.test(config[key] ?? '')) throw new Error(`Invalid generated ${key}`);
  }
  return config;
}
function composeArgs(config, file = configPath) {
  return ['compose', '--project-name', config.COMPOSE_PROJECT_NAME, '--env-file', file, '-f', path.join(root, 'docker-compose.yml')];
}
const childEnv = config => ({ ...process.env, ...config, PATH: `${bundled}:${process.env.PATH}` });
module.exports = { root, configPath, binary, readConfig, composeArgs, childEnv };
