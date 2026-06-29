const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RestaurantTable = sequelize.define('restaurant_table', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  restaurant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  table_number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  seats_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'restaurant_tables',
  underscored: true,
  timestamps: false,
});

module.exports = RestaurantTable;
