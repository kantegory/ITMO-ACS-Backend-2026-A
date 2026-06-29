const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const reviewController = require('../controllers/review.controller');

router.patch('/:reviewId', auth, reviewController.updateReview);
router.delete('/:reviewId', auth, reviewController.deleteReview);

module.exports = router;
