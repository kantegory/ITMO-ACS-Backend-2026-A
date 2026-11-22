const router = require('express').Router();
const controller = require('../controllers/reservationController');
const auth = require('../middleware/auth');

router.post('/', auth, controller.create);
router.get('/', auth, controller.getAll);

module.exports = router;