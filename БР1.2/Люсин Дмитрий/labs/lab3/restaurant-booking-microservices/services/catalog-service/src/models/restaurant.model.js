const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Restaurant = sequelize.define('Restaurant', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: false },
  city: { type: DataTypes.STRING, allowNull: false },
  district: { type: DataTypes.STRING, allowNull: true },
  average_check: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  price_category: { type: DataTypes.STRING, allowNull: false },
  average_rating: { type: DataTypes.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
  reviews_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  rating_sum: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'restaurants',
  underscored: true
});

module.exports = Restaurant;
