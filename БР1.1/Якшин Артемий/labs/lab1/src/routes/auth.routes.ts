import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller';
import { asyncHandler } from '../utils/async-handler';

const r = Router();
r.post('/register', asyncHandler(ctrl.register));
r.post('/login', asyncHandler(ctrl.login));
export default r;
