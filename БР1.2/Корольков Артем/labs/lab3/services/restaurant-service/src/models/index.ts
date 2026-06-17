import MenuItem from './MenuItem';
import Restaurant from './Restaurant';
import RestaurantPhoto from './RestaurantPhoto';
import Review from './Review';

Restaurant.hasMany(MenuItem);
MenuItem.belongsTo(Restaurant);

Restaurant.hasMany(RestaurantPhoto);
RestaurantPhoto.belongsTo(Restaurant);

Restaurant.hasMany(Review);
Review.belongsTo(Restaurant);

export { Restaurant, MenuItem, RestaurantPhoto, Review };
