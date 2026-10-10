import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// GET /bookings - Get all bookings (authenticated users see their own, admin sees all)
router.get('/', requireAuth, BookingController.getAllBookings);

// GET /bookings/:id - Get booking by ID (owner or admin)
router.get('/:id', requireAuth, BookingController.getBookingById);

// POST /bookings - Create a new booking (authenticated users)
router.post('/', requireAuth, BookingController.createBooking);

// PATCH /bookings/:id/status - Update booking status (owner or admin)
router.patch('/:id/status', requireAuth, BookingController.updateBookingStatus);

// DELETE /bookings/:id - Cancel booking (owner or admin)
router.delete('/:id', requireAuth, BookingController.deleteBooking);

export { router as bookingRoutes };