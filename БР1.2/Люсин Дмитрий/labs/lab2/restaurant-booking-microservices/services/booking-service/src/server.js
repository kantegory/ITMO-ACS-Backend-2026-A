require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const port = process.env.BOOKING_SERVICE_PORT || 3005;

sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Booking Service is running on http://localhost:${port}`);
  });
});
