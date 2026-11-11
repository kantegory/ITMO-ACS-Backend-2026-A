import { Router } from 'express';

import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import subscriptionRouter from './subscription.routes.js';
import internalRouter from './internal.routes.js';

const router = Router();

router.get('/user-service-health', (_req, res) => {
    res.status(200).json({
        status: 'user-service OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    })
});

router.use(authRouter);
router.use(userRouter);
router.use(subscriptionRouter);
router.use(internalRouter);

export default router;
