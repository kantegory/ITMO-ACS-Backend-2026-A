const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  restaurant_id: { type: DataTypes.INTEGER, allowNull: false },
  table_id: { type: DataTypes.INTEGER, allowNull: false },
  guests_count: { type: DataTypes.INTEGER, allowNull: false },
  booking_start: { type: DataTypes.DATE, allowNull: false },
  booking_end: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' }
}, {
  tableName: 'bookings',
  underscored: true
});

module.exports = Booking;
