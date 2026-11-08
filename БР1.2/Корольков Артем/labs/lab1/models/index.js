const User = require('./User');
const Restaurant = require('./Restaurant');
const Reservation = require('./Reservation');
const MenuItem = require('./MenuItem');
const RestaurantPhoto = require('./RestaurantPhoto');
const Review = require('./Review');

User.hasMany(Reservation);
Reservation.belongsTo(User);

Restaurant.hasMany(Reservation);
Reservation.belongsTo(Restaurant);

Restaurant.hasMany(MenuItem);
MenuItem.belongsTo(Restaurant);

Restaurant.hasMany(RestaurantPhoto);
RestaurantPhoto.belongsTo(Restaurant);

Restaurant.hasMany(Review);
Review.belongsTo(Restaurant);
User.hasMany(Review);
Review.belongsTo(User);

module.exports = {
  User,
  Restaurant,
  Reservation,
  MenuItem,
  RestaurantPhoto,
  Review
};