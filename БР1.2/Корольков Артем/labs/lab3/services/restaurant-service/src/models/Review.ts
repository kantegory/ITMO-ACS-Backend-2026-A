import { DataTypes } from 'sequelize';
import sequelize from '../config/db';

const Review = sequelize.define('Review', {
  UserId: { type: DataTypes.INTEGER, allowNull: false },
  author_name: { type: DataTypes.STRING, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: false }
});

export default Review;
