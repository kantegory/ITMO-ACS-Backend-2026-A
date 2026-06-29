const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const storage = process.env.DB_STORAGE || path.join(__dirname, '../../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false,
});

module.exports = sequelize;
