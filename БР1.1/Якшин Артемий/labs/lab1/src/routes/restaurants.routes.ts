import { Router } from 'express';
import * as ctrl from '../controllers/restaurants.controller';
import * as tablesCtrl from '../controllers/tables.controller';
import { asyncHandler } from '../utils/async-handler';

const r = Router();
r.get('/', asyncHandler(ctrl.list));
r.get('/:id', asyncHandler(ctrl.getById));
r.get('/:id/photos', asyncHandler(ctrl.getPhotos));
r.get('/:id/menu', asyncHandler(ctrl.getMenu));
r.get('/:id/reviews', asyncHandler(ctrl.getReviews));
r.get('/:id/tables', asyncHandler(tablesCtrl.listAvailable));
export default r;
