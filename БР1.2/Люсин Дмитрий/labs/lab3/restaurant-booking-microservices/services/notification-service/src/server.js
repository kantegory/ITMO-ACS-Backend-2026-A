require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const { startDomainEventsConsumer } = require('./consumers/domainEvents.consumer');

const port = process.env.NOTIFICATION_SERVICE_PORT || 3007;

sequelize.sync().then(async () => {
  await startDomainEventsConsumer();

  app.listen(port, () => {
    console.log(`Notification Service is running on http://localhost:${port}`);
  });
});
