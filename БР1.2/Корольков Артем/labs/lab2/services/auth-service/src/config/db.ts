import path from 'path';
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../../data/auth.sqlite'),
  logging: false
});

export default sequelize;
