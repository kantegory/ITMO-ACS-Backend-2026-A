import { Router } from 'express';
import auth from '../middleware/auth';
import { createFromRestaurant } from '../controllers/reservationController';

const router = Router();
router.post('/:id/reservations', auth, createFromRestaurant);

export default router;
