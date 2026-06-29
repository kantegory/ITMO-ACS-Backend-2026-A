require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const port = process.env.AUTH_SERVICE_PORT || 3001;

sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Auth & User Service is running on http://localhost:${port}`);
  });
});
