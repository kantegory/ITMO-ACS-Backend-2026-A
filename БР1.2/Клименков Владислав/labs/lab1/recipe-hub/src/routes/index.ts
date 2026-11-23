import { Router } from 'express'
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import directoryRouter from './directory.routes.js';
import recipeRouter from './recipe.routes.js';
import commentRouter from './comment.routes.js';
import subscriptionRouter from './subscription.routes.js';
import stepRouter from './step.routes.js';

const router = Router();

router.use(authRouter);
router.use(userRouter);
router.use(recipeRouter);
router.use(stepRouter);
router.use(directoryRouter);
router.use(commentRouter);
router.use(subscriptionRouter);

export default router;
