import { Router } from 'express';
import * as ctrl from '../controllers/reviews.controller';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../utils/async-handler';

const r = Router();
r.post('/', authMiddleware, asyncHandler(ctrl.create));
r.put('/:id', authMiddleware, asyncHandler(ctrl.update));
r.delete('/:id', authMiddleware, asyncHandler(ctrl.remove));
export default r;
