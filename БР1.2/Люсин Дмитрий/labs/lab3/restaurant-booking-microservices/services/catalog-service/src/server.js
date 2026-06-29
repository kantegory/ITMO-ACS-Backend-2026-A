require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const { startReviewEventsConsumer } = require('./consumers/reviewEvents.consumer');

const port = process.env.CATALOG_SERVICE_PORT || 3002;

sequelize.sync().then(async () => {
  await startReviewEventsConsumer();

  app.listen(port, () => {
    console.log(`Restaurant Catalog Service is running on http://localhost:${port}`);
  });
});
