require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const port = process.env.PORT || 3000;

const start = async () => {
  await sequelize.authenticate();
  await sequelize.sync();

  app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
    console.log(`Swagger docs: http://localhost:${port}/api-docs`);
  });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
