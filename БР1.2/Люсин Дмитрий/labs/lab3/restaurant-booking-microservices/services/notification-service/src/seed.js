require('dotenv').config();
const { sequelize } = require('./models');

const seed = async () => {
  await sequelize.sync({ force: true });
  console.log('Notification Service database seeded');
  await sequelize.close();
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
