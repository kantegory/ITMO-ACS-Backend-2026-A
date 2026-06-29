require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const { connectRabbit } = require('./utils/rabbit');

const port = process.env.REVIEW_SERVICE_PORT || 3006;

sequelize.sync().then(async () => {
  await connectRabbit();

  app.listen(port, () => {
    console.log(`Review Service is running on http://localhost:${port}`);
  });
});
