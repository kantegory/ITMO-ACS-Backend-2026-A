const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const serviceAuthMiddleware = require('../middlewares/serviceAuth.middleware');

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authMiddleware, authController.me);
router.get('/users/profile', authMiddleware, userController.getProfile);
router.patch('/users/profile', authMiddleware, userController.updateProfile);
router.post('/internal/auth/token/verify', serviceAuthMiddleware, authController.verifyToken);
router.get('/internal/users/:userId', serviceAuthMiddleware, userController.getInternalUser);
router.get('/internal/users/:userId/exists', serviceAuthMiddleware, userController.checkUserExists);

module.exports = router;
