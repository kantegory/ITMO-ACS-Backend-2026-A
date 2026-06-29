const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const authController = require('../controllers/auth.controller');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.me);

module.exports = router;
