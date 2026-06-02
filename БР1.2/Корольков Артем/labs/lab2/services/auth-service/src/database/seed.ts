import bcrypt from 'bcryptjs';
import sequelize from '../config/db';
import User from '../models/User';

async function run() {
  await sequelize.sync({ force: true });
  await User.create({
    name: 'Demo User',
    email: 'demo@example.com',
    password_hash: await bcrypt.hash('demo12345', 10)
  });
  console.log('Auth service database seeded.');
  process.exit(0);
}

run().catch((error) => {
  console.error('Auth seed failed:', error);
  process.exit(1);
});
