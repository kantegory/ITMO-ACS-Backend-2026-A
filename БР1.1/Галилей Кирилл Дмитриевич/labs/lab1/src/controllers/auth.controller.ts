import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source';
import { User, UserRole } from '../models/user.entity';
import { SETTINGS } from '../config/settings';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();
const userRepo = AppDataSource.getRepository(User);

// POST /api/v1/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name, phone, role } = req.body;

    if (!email || !password || !full_name) {
      res.status(400).json({ statusCode: 400, error: 'Bad Request', message: 'Email, password and full_name are required' });
      return;
    }

    const existing = await userRepo.findOne({ where: { email } });
    if (existing) {
      res.status(409).json({ statusCode: 409, error: 'Conflict', message: 'User with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = userRepo.create({
      email,
      password_hash,
      full_name,
      phone,
      role: role === 'manager' ? UserRole.MANAGER : UserRole.CUSTOMER
    });
    await userRepo.save(user);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      SETTINGS.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ statusCode: 400, error: 'Bad Request', message: 'Email and password are required' });
      return;
    }

    const user = await userRepo
      .createQueryBuilder('u')
      .addSelect('u.password_hash')
      .where('u.email = :email', { email })
      .getOne();

    if (!user) {
      res.status(401).json({ statusCode: 401, error: 'Unauthorized', message: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ statusCode: 401, error: 'Unauthorized', message: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      SETTINGS.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await userRepo.findOne({ where: { id: req.user!.id } });
    if (!user) {
      res.status(404).json({ statusCode: 404, error: 'Not Found', message: 'User not found' });
      return;
    }
    res.status(200).json(user);
  } catch (err: any) {
    res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
  }
});

export default router;
