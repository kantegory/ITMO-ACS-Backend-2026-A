const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Reservation = sequelize.define('Reservation', {
  guests_count: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reservation_datetime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'created'
  }
});

module.exports = Reservation;