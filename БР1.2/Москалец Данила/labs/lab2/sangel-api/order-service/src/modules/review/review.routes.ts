import { Router } from 'express';
import { ReviewController } from './review.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { CreateReviewSchema } from './review.dto';

const router = Router();
const reviewController = new ReviewController();

// Публичные маршруты
router.get('/services/:service_id/reviews', reviewController.getServiceReviews);
router.get('/companies/:company_id/reviews', reviewController.getCompanyReviews);

// Защищенные маршруты
router.get('/me/reviews', authMiddleware, reviewController.getMyReviews);
router.post('/services/:service_id/reviews', authMiddleware, validate(CreateReviewSchema), reviewController.createReview);
router.delete('/reviews/:review_id', authMiddleware, reviewController.deleteReview);

export default router;