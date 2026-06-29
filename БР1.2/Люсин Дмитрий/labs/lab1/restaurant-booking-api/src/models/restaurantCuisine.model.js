const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RestaurantCuisine = sequelize.define('restaurant_cuisine', {
  restaurant_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  cuisine_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
}, {
  tableName: 'restaurant_cuisines',
  underscored: true,
  timestamps: false,
});

module.exports = RestaurantCuisine;
