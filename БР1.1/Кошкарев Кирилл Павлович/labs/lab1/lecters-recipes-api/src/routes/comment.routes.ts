import { Router } from 'express';
import { socialController } from '../controllers/social.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../middlewares/asyncHandler';
import { idParamSchema, updateCommentSchema } from '../dto';

export const commentRouter = Router();

commentRouter.patch(
  '/:id',
  authenticate,
  validate(idParamSchema, 'params'),
  validate(updateCommentSchema),
  asyncHandler(socialController.updateComment),
);
commentRouter.delete(
  '/:id',
  authenticate,
  validate(idParamSchema, 'params'),
  asyncHandler(socialController.removeComment),
);
