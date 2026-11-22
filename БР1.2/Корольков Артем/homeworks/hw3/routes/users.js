const router = require('express').Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/userController');

router.get('/me', auth, controller.me);
router.get('/me/reservations', auth, controller.myReservationHistory);

module.exports = router;
