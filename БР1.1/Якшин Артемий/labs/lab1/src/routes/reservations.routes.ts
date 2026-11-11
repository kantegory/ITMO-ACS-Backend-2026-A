import { Router } from 'express';
import * as ctrl from '../controllers/reservations.controller';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../utils/async-handler';

const r = Router();
r.post('/', authMiddleware, asyncHandler(ctrl.create));
r.get('/:id', authMiddleware, asyncHandler(ctrl.getById));
r.put('/:id', authMiddleware, asyncHandler(ctrl.update));
r.delete('/:id', authMiddleware, asyncHandler(ctrl.cancel));
export default r;
