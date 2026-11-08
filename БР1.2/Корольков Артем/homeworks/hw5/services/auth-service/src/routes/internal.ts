import { Router } from 'express';
import { requireServiceKey } from '../../../shared/src/serviceAuth';
import { getUserById, verifyAuthToken } from '../controllers/internalController';

const router = Router();
router.use(requireServiceKey);
router.get('/users/:id', getUserById);
router.post('/auth/verify', verifyAuthToken);

export default router;
