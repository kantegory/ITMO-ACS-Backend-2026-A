require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const { connectRabbit } = require('./utils/rabbit');

const port = process.env.BOOKING_SERVICE_PORT || 3005;

sequelize.sync().then(async () => {
  await connectRabbit();

  app.listen(port, () => {
    console.log(`Booking Service is running on http://localhost:${port}`);
  });
});
