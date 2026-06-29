const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RestaurantPhoto = sequelize.define('RestaurantPhoto', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  restaurant_id: { type: DataTypes.INTEGER, allowNull: false },
  photo_url: { type: DataTypes.STRING, allowNull: false },
  is_main: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, {
  tableName: 'restaurant_photos',
  underscored: true
});

module.exports = RestaurantPhoto;
