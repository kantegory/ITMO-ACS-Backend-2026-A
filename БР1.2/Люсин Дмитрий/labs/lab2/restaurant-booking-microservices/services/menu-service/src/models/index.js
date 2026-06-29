const sequelize = require('../config/database');
const MenuCategory = require('./menuCategory.model');
const MenuItem = require('./menuItem.model');

MenuCategory.hasMany(MenuItem, { foreignKey: 'menu_category_id', as: 'items' });
MenuItem.belongsTo(MenuCategory, { foreignKey: 'menu_category_id', as: 'category' });

module.exports = { sequelize, MenuCategory, MenuItem };
