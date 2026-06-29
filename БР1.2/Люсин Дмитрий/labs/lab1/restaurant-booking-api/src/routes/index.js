const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/cuisines', require('./cuisine.routes'));
router.use('/restaurants', require('./restaurant.routes'));
router.use('/photos', require('./photo.routes'));
router.use('/menu', require('./menu.routes'));
router.use('/menu-categories', require('./menuCategory.routes'));
router.use('/menu-items', require('./menuItem.routes'));
router.use('/tables', require('./table.routes'));
router.use('/restaurant-tables', require('./restaurantTable.routes'));
router.use('/bookings', require('./booking.routes'));
router.use('/reviews', require('./review.routes'));

module.exports = router;
