import { Router } from 'express';
import { CategoryController } from './category.controller';
import { authMiddleware, roleMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { CreateCategorySchema, UpdateCategorySchema } from './category.dto';

const router = Router();
const categoryController = new CategoryController();

router.get('/', categoryController.list);
router.get('/all', authMiddleware, roleMiddleware(['ADMIN']), categoryController.listAll);
router.post('/', authMiddleware, roleMiddleware(['ADMIN']), validate(CreateCategorySchema), categoryController.create);
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN']), validate(UpdateCategorySchema), categoryController.update);
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN']), categoryController.delete);

export default router;