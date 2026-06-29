const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MenuCategory = sequelize.define('MenuCategory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  restaurant_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'menu_categories',
  underscored: true
});

module.exports = MenuCategory;
