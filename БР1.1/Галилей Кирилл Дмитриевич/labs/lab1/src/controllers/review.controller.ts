import { Router, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Review } from '../models/review.entity';
import { Restaurant } from '../models/restaurant.entity';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });
const reviewRepo = AppDataSource.getRepository(Review);
const restaurantRepo = AppDataSource.getRepository(Restaurant);

// GET /api/v1/restaurants/:restaurantId/reviews
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviews = await reviewRepo.find({
      where: { restaurant_id: req.params.restaurantId },
      relations: ['user'],
      order: { created_at: 'DESC' }
    });
    res.status(200).json(reviews);
  } catch (err: any) {
    res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
  }
});

// POST /api/v1/restaurants/:restaurantId/reviews
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rating, comment } = req.body;
    const restaurantId = req.params.restaurantId;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ statusCode: 400, error: 'Bad Request', message: 'Rating must be an integer between 1 and 5' });
      return;
    }

    const review = reviewRepo.create({
      user_id: req.user!.id,
      restaurant_id: restaurantId,
      rating,
      comment
    });
    await reviewRepo.save(review);

    // Recalculate average restaurant rating
    const allReviews = await reviewRepo.find({ where: { restaurant_id: restaurantId } });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await restaurantRepo.update(restaurantId, { rating: Math.round(avg * 100) / 100 });

    res.status(201).json(review);
  } catch (err: any) {
    res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
  }
});

export default router;
