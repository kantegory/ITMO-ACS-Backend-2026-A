import { Router } from 'express';
import * as ctrl from '../controllers/cuisines.controller';
import { asyncHandler } from '../utils/async-handler';

const r = Router();
r.get('/', asyncHandler(ctrl.list));
export default r;
