const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { docker, image, freePorts } = require('./docker.cjs');
const configFile = path.resolve(__dirname, '..', '.env.hw5');

async function main() {
  const config = dotenv.parse(fs.readFileSync(configFile));
  const name = config.RABBITMQ_CONTAINER;
  if (!/^itmo-hw5-[a-f0-9]{12}$/.test(name)) throw new Error('Unexpected project container name');
  const exists = docker(['ps', '-a', '--filter', `name=^/${name}$`, '--format', '{{.Names}}']) === name;
  if (exists && docker(['inspect', '--format', '{{index .Config.Labels "com.itmo.project"}}', name]) !== 'restaurant-booking-hw5') throw new Error('Container ownership does not match');
  const action = process.argv[2] ?? 'start';
  if (action === 'stop') { if (exists) docker(['stop', name]); console.log('Project broker stopped; data retained.'); return; }
  if (action !== 'start') throw new Error('Use start or stop');
  if (exists) docker(['start', name]);
  else {
    const [amqpPort, managementPort] = await freePorts(2);
    docker(['run', '-d', '--name', name, '--hostname', name, '--label', 'com.itmo.project=restaurant-booking-hw5',
      '--memory', '512m', '--cpus', '1', '-p', `127.0.0.1:${amqpPort}:5672`, '-p', `127.0.0.1:${managementPort}:15672`,
      '-v', `${name}-data:/var/lib/rabbitmq`, '-e', 'RABBITMQ_DEFAULT_USER', '-e', 'RABBITMQ_DEFAULT_PASS', '-e', 'RABBITMQ_DEFAULT_VHOST', image],
    { env: { RABBITMQ_DEFAULT_USER: config.RABBITMQ_USER, RABBITMQ_DEFAULT_PASS: config.RABBITMQ_PASSWORD, RABBITMQ_DEFAULT_VHOST: config.RABBITMQ_VHOST } });
  }
  const amqpPort = docker(['port', name, '5672/tcp']).split(':').pop();
  const managementPort = docker(['port', name, '15672/tcp']).split(':').pop();
  const values = {
    RABBITMQ_URL: `amqp://${encodeURIComponent(config.RABBITMQ_USER)}:${encodeURIComponent(config.RABBITMQ_PASSWORD)}@127.0.0.1:${amqpPort}/${encodeURIComponent(config.RABBITMQ_VHOST)}?heartbeat=2`,
    RABBITMQ_MANAGEMENT_PORT: managementPort,
  };
  let text = fs.readFileSync(configFile, 'utf8');
  for (const [key, value] of Object.entries(values)) {
    const line = `${key}=${value}`;
    text = new RegExp(`^${key}=.*$`, 'm').test(text) ? text.replace(new RegExp(`^${key}=.*$`, 'm'), line) : text + line + '\n';
  }
  fs.writeFileSync(configFile, text, { mode: 0o600 });
  const auth = 'Basic ' + Buffer.from(`${config.RABBITMQ_USER}:${config.RABBITMQ_PASSWORD}`).toString('base64');
  for (let attempt = 0; attempt < 90; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${managementPort}/api/overview`, { headers: { authorization: auth }, signal: AbortSignal.timeout(1000) });
      if (response.ok) { console.log(`RabbitMQ ready. AMQP: 127.0.0.1:${amqpPort}; management: http://127.0.0.1:${managementPort}`); return; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('RabbitMQ startup timed out');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
