const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RestaurantCuisine = sequelize.define('RestaurantCuisine', {
  restaurant_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  cuisine_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true }
}, {
  tableName: 'restaurant_cuisines',
  underscored: true,
  timestamps: false
});

module.exports = RestaurantCuisine;
