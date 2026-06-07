import { Router } from 'express';
import { CategoryController } from './category.controller';
import { authMiddleware, roleMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { CreateCategorySchema, UpdateCategorySchema } from './category.dto';

const router = Router();
const categoryController = new CategoryController();

// Публичные маршруты
router.get('/', categoryController.list);

// Защищенные маршруты (только ADMIN)
router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN']));

router.get('/all', categoryController.listAll);
router.post('/', validate(CreateCategorySchema), categoryController.create);
router.put('/:id', validate(UpdateCategorySchema), categoryController.update);
router.delete('/:id', categoryController.delete);

export default router;