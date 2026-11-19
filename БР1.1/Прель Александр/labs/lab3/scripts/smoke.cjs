const { readConfig } = require('./config.cjs');
process.env.GATEWAY_PORT = readConfig().API_PORT;
require('../../lab2/scripts/smoke-messaging.cjs');
