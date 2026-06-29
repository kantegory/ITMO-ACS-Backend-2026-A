const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');
const bookingController = require('../controllers/booking.controller');

router.post('/', auth, bookingController.createBooking);
router.get('/my', auth, bookingController.getMyBookings);
router.get('/', auth, permit('admin'), bookingController.getBookings);
router.get('/:bookingId', auth, bookingController.getBookingById);
router.patch('/:bookingId/cancel', auth, bookingController.cancelBooking);
router.patch('/:bookingId/status', auth, permit('admin'), bookingController.updateBookingStatus);

module.exports = router;
