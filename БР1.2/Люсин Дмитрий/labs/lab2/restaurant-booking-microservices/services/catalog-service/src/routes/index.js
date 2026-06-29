const router = require('express').Router();
const controller = require('../controllers/restaurant.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const serviceAuthMiddleware = require('../middlewares/serviceAuth.middleware');

router.get('/restaurants', controller.getRestaurants);
router.post('/restaurants', authMiddleware, roleMiddleware('admin'), controller.createRestaurant);
router.get('/restaurants/:restaurantId', controller.getRestaurant);
router.patch('/restaurants/:restaurantId', authMiddleware, roleMiddleware('admin'), controller.updateRestaurant);
router.delete('/restaurants/:restaurantId', authMiddleware, roleMiddleware('admin'), controller.deleteRestaurant);
router.get('/restaurants/:restaurantId/tables', controller.getTables);
router.post('/restaurants/:restaurantId/tables', authMiddleware, roleMiddleware('admin'), controller.createTable);
router.patch('/restaurants/:restaurantId/tables/:tableId', authMiddleware, roleMiddleware('admin'), controller.updateTable);
router.delete('/restaurants/:restaurantId/tables/:tableId', authMiddleware, roleMiddleware('admin'), controller.deleteTable);
router.get('/cuisines', controller.getCuisines);
router.post('/cuisines', authMiddleware, roleMiddleware('admin'), controller.createCuisine);
router.get('/internal/restaurants/:restaurantId', serviceAuthMiddleware, controller.getInternalRestaurant);
router.get('/internal/restaurants/:restaurantId/exists', serviceAuthMiddleware, controller.checkRestaurantExists);
router.get('/internal/restaurants/:restaurantId/tables', serviceAuthMiddleware, controller.getTables);
router.get('/internal/restaurants/:restaurantId/tables/:tableId', serviceAuthMiddleware, controller.getInternalTable);

module.exports = router;
