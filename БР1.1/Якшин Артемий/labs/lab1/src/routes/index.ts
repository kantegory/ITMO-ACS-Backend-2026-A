import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import restaurantsRoutes from './restaurants.routes';
import cuisinesRoutes from './cuisines.routes';
import reservationsRoutes from './reservations.routes';
import reviewsRoutes from './reviews.routes';

const router = Router();
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/restaurants', restaurantsRoutes);
router.use('/cuisines', cuisinesRoutes);
router.use('/reservations', reservationsRoutes);
router.use('/reviews', reviewsRoutes);
export default router;
