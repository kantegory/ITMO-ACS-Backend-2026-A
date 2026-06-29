require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const port = process.env.CATALOG_SERVICE_PORT || 3002;

sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Restaurant Catalog Service is running on http://localhost:${port}`);
  });
});
