require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const port = process.env.MENU_SERVICE_PORT || 3003;

sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Menu Service is running on http://localhost:${port}`);
  });
});
