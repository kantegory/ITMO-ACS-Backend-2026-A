import { DataTypes } from 'sequelize';
import sequelize from '../config/db';

const Reservation = sequelize.define('Reservation', {
  UserId: { type: DataTypes.INTEGER, allowNull: false },
  RestaurantId: { type: DataTypes.INTEGER, allowNull: false },
  restaurant_name: { type: DataTypes.STRING, allowNull: false },
  restaurant_city: { type: DataTypes.STRING, allowNull: false },
  restaurant_cuisine: { type: DataTypes.STRING, allowNull: false },
  restaurant_average_check: { type: DataTypes.INTEGER, allowNull: false },
  guests_count: { type: DataTypes.INTEGER, allowNull: false },
  reservation_datetime: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'created' }
});

export default Reservation;
