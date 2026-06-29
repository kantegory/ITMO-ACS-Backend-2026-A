const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');
const restaurantController = require('../controllers/restaurant.controller');
const photoController = require('../controllers/photo.controller');
const menuController = require('../controllers/menu.controller');
const tableController = require('../controllers/table.controller');
const reviewController = require('../controllers/review.controller');

router.get('/', restaurantController.getRestaurants);
router.post('/', auth, permit('admin'), restaurantController.createRestaurant);
router.get('/:restaurantId', restaurantController.getRestaurantById);
router.patch('/:restaurantId', auth, permit('admin'), restaurantController.updateRestaurant);
router.delete('/:restaurantId', auth, permit('admin'), restaurantController.deleteRestaurant);

router.post('/:restaurantId/cuisines', auth, permit('admin'), restaurantController.addCuisineToRestaurant);
router.delete('/:restaurantId/cuisines/:cuisineId', auth, permit('admin'), restaurantController.removeCuisineFromRestaurant);

router.get('/:restaurantId/photos', photoController.getRestaurantPhotos);
router.post('/:restaurantId/photos', auth, permit('admin'), photoController.createRestaurantPhoto);
router.delete('/:restaurantId/photos/:photoId', auth, permit('admin'), photoController.deletePhoto);

router.get('/:restaurantId/menu', menuController.getRestaurantMenu);
router.post('/:restaurantId/menu/categories', auth, permit('admin'), menuController.createMenuCategory);
router.post('/:restaurantId/menu-categories', auth, permit('admin'), menuController.createMenuCategory);

router.get('/:restaurantId/tables', tableController.getRestaurantTables);
router.post('/:restaurantId/tables', auth, permit('admin'), tableController.createTable);

router.get('/:restaurantId/reviews', reviewController.getRestaurantReviews);
router.post('/:restaurantId/reviews', auth, reviewController.createReview);

module.exports = router;
