import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// GET /reviews - Get all reviews (public)
router.get('/', ReviewController.getAllReviews);

// GET /reviews/:id - Get review by ID (public)
router.get('/:id', ReviewController.getReviewById);

// POST /reviews - Create a new review (authenticated users)
router.post('/', requireAuth, ReviewController.createReview);

// PATCH /reviews/:id - Update review (owner only)
router.patch('/:id', requireAuth, ReviewController.updateReview);

// DELETE /reviews/:id - Delete review (owner or admin)
router.delete('/:id', requireAuth, ReviewController.deleteReview);

export { router as reviewRoutes };