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
router.use(authMiddleware);

router.get('/me/reviews', reviewController.getMyReviews);
router.post('/services/:service_id/reviews', validate(CreateReviewSchema), reviewController.createReview);
router.delete('/reviews/:review_id', reviewController.deleteReview);

export default router;