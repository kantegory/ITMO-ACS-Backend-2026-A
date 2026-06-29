require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const port = process.env.REVIEW_SERVICE_PORT || 3006;

sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Review Service is running on http://localhost:${port}`);
  });
});
