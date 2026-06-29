const sequelize = require('../config/database');
const User = require('./user.model');
const Restaurant = require('./restaurant.model');
const Cuisine = require('./cuisine.model');
const RestaurantCuisine = require('./restaurantCuisine.model');
const RestaurantPhoto = require('./restaurantPhoto.model');
const MenuCategory = require('./menuCategory.model');
const MenuItem = require('./menuItem.model');
const RestaurantTable = require('./restaurantTable.model');
const Booking = require('./booking.model');
const Review = require('./review.model');

User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Restaurant.hasMany(RestaurantPhoto, { foreignKey: 'restaurant_id', as: 'photos', onDelete: 'CASCADE' });
RestaurantPhoto.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant' });

Restaurant.hasMany(MenuCategory, { foreignKey: 'restaurant_id', as: 'menu_categories', onDelete: 'CASCADE' });
MenuCategory.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant' });

MenuCategory.hasMany(MenuItem, { foreignKey: 'menu_category_id', as: 'items', onDelete: 'CASCADE' });
MenuItem.belongsTo(MenuCategory, { foreignKey: 'menu_category_id', as: 'category' });

Restaurant.hasMany(RestaurantTable, { foreignKey: 'restaurant_id', as: 'tables', onDelete: 'CASCADE' });
RestaurantTable.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant' });

Restaurant.hasMany(Booking, { foreignKey: 'restaurant_id', as: 'bookings' });
Booking.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant' });

RestaurantTable.hasMany(Booking, { foreignKey: 'table_id', as: 'bookings' });
Booking.belongsTo(RestaurantTable, { foreignKey: 'table_id', as: 'table' });

Restaurant.hasMany(Review, { foreignKey: 'restaurant_id', as: 'reviews' });
Review.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant' });

Booking.hasOne(Review, { foreignKey: 'booking_id', as: 'review' });
Review.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

Restaurant.belongsToMany(Cuisine, {
  through: RestaurantCuisine,
  foreignKey: 'restaurant_id',
  otherKey: 'cuisine_id',
  as: 'cuisines',
});

Cuisine.belongsToMany(Restaurant, {
  through: RestaurantCuisine,
  foreignKey: 'cuisine_id',
  otherKey: 'restaurant_id',
  as: 'restaurants',
});

module.exports = {
  sequelize,
  User,
  Restaurant,
  Cuisine,
  RestaurantCuisine,
  RestaurantPhoto,
  MenuCategory,
  MenuItem,
  RestaurantTable,
  Booking,
  Review,
};
