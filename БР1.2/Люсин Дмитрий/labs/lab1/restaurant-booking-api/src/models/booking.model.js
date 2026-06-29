const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  restaurant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  table_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  guests_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  booking_start: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  booking_end: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
    allowNull: false,
    defaultValue: 'pending',
  },
}, {
  tableName: 'bookings',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Booking;
