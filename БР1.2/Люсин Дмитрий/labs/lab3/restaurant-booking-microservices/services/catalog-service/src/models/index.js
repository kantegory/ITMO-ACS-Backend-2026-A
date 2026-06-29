const sequelize = require('../config/database');
const Restaurant = require('./restaurant.model');
const Cuisine = require('./cuisine.model');
const RestaurantCuisine = require('./restaurantCuisine.model');
const RestaurantTable = require('./restaurantTable.model');

Restaurant.belongsToMany(Cuisine, { through: RestaurantCuisine, foreignKey: 'restaurant_id', otherKey: 'cuisine_id', as: 'cuisines' });
Cuisine.belongsToMany(Restaurant, { through: RestaurantCuisine, foreignKey: 'cuisine_id', otherKey: 'restaurant_id', as: 'restaurants' });
Restaurant.hasMany(RestaurantTable, { foreignKey: 'restaurant_id', as: 'tables' });
RestaurantTable.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant' });

module.exports = { sequelize, Restaurant, Cuisine, RestaurantCuisine, RestaurantTable };
