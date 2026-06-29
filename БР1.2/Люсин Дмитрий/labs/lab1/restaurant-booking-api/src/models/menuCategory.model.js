const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MenuCategory = sequelize.define('menu_category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  restaurant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'menu_categories',
  underscored: true,
  timestamps: false,
});

module.exports = MenuCategory;
