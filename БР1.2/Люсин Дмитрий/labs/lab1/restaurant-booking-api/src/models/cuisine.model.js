const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cuisine = sequelize.define('cuisine', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'cuisines',
  underscored: true,
  timestamps: false,
});

module.exports = Cuisine;
