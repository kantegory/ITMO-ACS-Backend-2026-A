const router = require('express').Router();
const controller = require('../controllers/review.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const serviceAuthMiddleware = require('../middlewares/serviceAuth.middleware');

router.get('/restaurants/:restaurantId/reviews', controller.getRestaurantReviews);
router.post('/restaurants/:restaurantId/reviews', authMiddleware, controller.createReview);
router.patch('/reviews/:reviewId', authMiddleware, controller.updateReview);
router.delete('/reviews/:reviewId', authMiddleware, controller.deleteReview);
router.get('/internal/restaurants/:restaurantId/reviews', serviceAuthMiddleware, controller.getInternalReviews);

module.exports = router;
