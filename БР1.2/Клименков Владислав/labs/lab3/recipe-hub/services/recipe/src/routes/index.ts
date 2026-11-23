import { Router } from 'express';

import directoryRouter from './directory.routes';
import recipeRouter from './recipe.routes';
import commentRouter from './comment.routes';
import stepRouter from './step.routes';
import internalRouter from './internal.routes';

const router = Router();

router.get('/recipe-service-health', (_req, res) => {
    res.status(200).json({
        status: 'recipe-service OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    })
});

router.use(directoryRouter);
router.use(recipeRouter);
router.use(commentRouter);
router.use(stepRouter);
router.use(internalRouter);

export default router;
