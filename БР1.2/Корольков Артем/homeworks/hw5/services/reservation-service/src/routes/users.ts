import { Router } from 'express';
import auth from '../middleware/auth';
import { myReservationHistory } from '../controllers/reservationController';

const router = Router();
router.get('/me/reservations', auth, myReservationHistory);

export default router;
