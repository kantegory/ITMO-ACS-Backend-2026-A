import { DataTypes } from 'sequelize';
import sequelize from '../config/db';

const RestaurantPhoto = sequelize.define('RestaurantPhoto', {
  url: { type: DataTypes.STRING, allowNull: false }
});

export default RestaurantPhoto;
