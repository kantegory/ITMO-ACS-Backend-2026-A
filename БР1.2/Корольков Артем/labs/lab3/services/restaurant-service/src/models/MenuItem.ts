import { DataTypes } from 'sequelize';
import sequelize from '../config/db';

const MenuItem = sequelize.define('MenuItem', {
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.INTEGER, allowNull: false }
});

export default MenuItem;
