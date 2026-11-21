const router = require('express').Router();
const controller = require('../controllers/restaurantController');
const auth = require('../middleware/auth');

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/:id/reservations', auth, controller.createReservation);

module.exports = router;