require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const port = process.env.MEDIA_SERVICE_PORT || 3004;

sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Media Service is running on http://localhost:${port}`);
  });
});
