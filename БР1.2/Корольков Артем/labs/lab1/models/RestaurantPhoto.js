const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RestaurantPhoto = sequelize.define('RestaurantPhoto', {
  url: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = RestaurantPhoto;
