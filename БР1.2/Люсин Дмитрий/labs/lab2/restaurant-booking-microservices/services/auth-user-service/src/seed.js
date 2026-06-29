require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./models');

const seed = async () => {
  await sequelize.sync({ force: true });

  await User.bulkCreate([
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password_hash: await bcrypt.hash('Admin12345', 10),
      phone: '+79990000001',
      role: 'admin',
      is_active: true
    },
    {
      name: 'Ivan Petrov',
      email: 'user@example.com',
      password_hash: await bcrypt.hash('User12345', 10),
      phone: '+79990000002',
      role: 'user',
      is_active: true
    }
  ]);

  console.log('Auth & User Service database seeded');
  await sequelize.close();
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
