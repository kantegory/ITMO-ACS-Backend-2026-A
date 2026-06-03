import { Router } from 'express';
import * as ctrl from '../controllers/users.controller';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../utils/async-handler';

const r = Router();
r.get('/me', authMiddleware, asyncHandler(ctrl.getMe));
r.put('/me', authMiddleware, asyncHandler(ctrl.updateMe));
r.get('/me/reservations', authMiddleware, asyncHandler(ctrl.getMyReservations));
export default r;
