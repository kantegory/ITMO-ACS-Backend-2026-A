const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MenuItem = sequelize.define('MenuItem', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = MenuItem;
