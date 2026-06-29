const path = require('path');
const { Sequelize } = require('sequelize');

const storage = path.join(__dirname, '..', '..', '..', '..', 'data', 'auth_user.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false
});

module.exports = sequelize;
