import { Router } from 'express';
import auth from '../middleware/auth';
import { me } from '../controllers/userController';

const router = Router();
router.get('/me', auth, me);

export default router;
