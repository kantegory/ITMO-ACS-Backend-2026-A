import path from 'path';
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../../data/reservation.sqlite'),
  logging: false
});

export default sequelize;
