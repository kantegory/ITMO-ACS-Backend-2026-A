const router = require('express').Router();
const controller = require('../controllers/booking.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const serviceAuthMiddleware = require('../middlewares/serviceAuth.middleware');

router.post('/bookings', authMiddleware, controller.createBooking);
router.get('/bookings/my', authMiddleware, controller.getMyBookings);
router.get('/bookings/:bookingId', authMiddleware, controller.getBooking);
router.patch('/bookings/:bookingId/cancel', authMiddleware, controller.cancelBooking);
router.get('/admin/bookings', authMiddleware, roleMiddleware('admin'), controller.getAllBookings);
router.patch('/admin/bookings/:bookingId/status', authMiddleware, roleMiddleware('admin'), controller.updateBookingStatus);
router.post('/internal/bookings', serviceAuthMiddleware, controller.createInternalBooking);
router.post('/internal/bookings/check-availability', serviceAuthMiddleware, controller.checkAvailability);
router.get('/internal/bookings/:bookingId', serviceAuthMiddleware, controller.getInternalBooking);
router.get('/internal/bookings/:bookingId/review-permission', serviceAuthMiddleware, controller.checkReviewPermission);
router.patch('/internal/bookings/:bookingId/status', serviceAuthMiddleware, controller.updateBookingStatus);

module.exports = router;
