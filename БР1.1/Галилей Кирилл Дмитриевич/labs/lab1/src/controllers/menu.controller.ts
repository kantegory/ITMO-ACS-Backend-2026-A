import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { MenuItem, MenuCategory } from '../models/menu-item.entity';
import { authenticateToken, requireRole, AuthRequest } from '../middlewares/auth.middleware';
import { UserRole } from '../models/user.entity';

const router = Router({ mergeParams: true });
const menuRepo = AppDataSource.getRepository(MenuItem);

// GET /api/v1/restaurants/:restaurantId/menu
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query;
    const where: any = { restaurant_id: req.params.restaurantId, is_available: true };
    if (category) {
      where.category = category;
    }

    const items = await menuRepo.find({ where, order: { category: 'ASC', name: 'ASC' } });
    res.status(200).json(items);
  } catch (err: any) {
    res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
  }
});

// POST /api/v1/restaurants/:restaurantId/menu
router.post('/', authenticateToken, requireRole([UserRole.MANAGER, UserRole.ADMIN]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, price, category } = req.body;
    const item = menuRepo.create({
      restaurant_id: req.params.restaurantId,
      name,
      description,
      price,
      category: category || MenuCategory.MAIN,
      is_available: true
    });
    await menuRepo.save(item);
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
  }
});

export default router;
