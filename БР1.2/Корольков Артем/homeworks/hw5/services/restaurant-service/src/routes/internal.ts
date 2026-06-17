import { Router } from 'express';
import { requireServiceKey } from '../../../shared/src/serviceAuth';
import { getRestaurantById, getRestaurantsBatch } from '../controllers/internalController';

const router = Router();
router.use(requireServiceKey);
router.get('/restaurants/batch', getRestaurantsBatch);
router.get('/restaurants/:id', getRestaurantById);

export default router;
