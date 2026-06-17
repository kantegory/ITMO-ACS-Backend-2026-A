import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authenticateTemp } from '../middleware/authenticateTemp';
import { validate } from '../middleware/validate';
import { RegisterStep1Dto } from '../dto/RegisterStep1Dto';
import { RegisterSeekerDto } from '../dto/RegisterSeekerDto';
import { RegisterEmployerDto } from '../dto/RegisterEmployerDto';
import { LoginDto } from '../dto/LoginDto';
import * as ctrl from '../controllers/auth.controller';

const router = Router();

router.post('/register/step1', validate(RegisterStep1Dto), ctrl.step1);
router.post('/register/seeker', authenticateTemp, validate(RegisterSeekerDto), ctrl.registerSeeker);
router.post('/register/employer', authenticateTemp, validate(RegisterEmployerDto), ctrl.registerEmployer);
router.post('/login', validate(LoginDto), ctrl.login);
router.get('/me', authenticate, ctrl.me);   
router.post('/logout', authenticate, ctrl.logout);

export default router;
