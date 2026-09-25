import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { RestaurantTable, TableZone } from '../models/table.entity';
import { Reservation, ReservationStatus } from '../models/reservation.entity';
import { authenticateToken, requireRole, AuthRequest } from '../middlewares/auth.middleware';
import { UserRole } from '../models/user.entity';

const router = Router({ mergeParams: true });
const tableRepo = AppDataSource.getRepository(RestaurantTable);
const reservationRepo = AppDataSource.getRepository(Reservation);

// GET /api/v1/restaurants/:restaurantId/tables
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tables = await tableRepo.find({
      where: { restaurant_id: req.params.restaurantId, is_active: true },
      order: { table_number: 'ASC' }
    });
    res.status(200).json(tables);
  } catch (err: any) {
    res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
  }
});

// POST /api/v1/restaurants/:restaurantId/tables
router.post('/', authenticateToken, requireRole([UserRole.MANAGER, UserRole.ADMIN]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { table_number, capacity, location_zone } = req.body;
    const table = tableRepo.create({
      restaurant_id: req.params.restaurantId,
      table_number,
      capacity,
      location_zone: location_zone || TableZone.MAIN_HALL,
      is_active: true
    });
    await tableRepo.save(table);
    res.status(201).json(table);
  } catch (err: any) {
    res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
  }
});

// GET /api/v1/restaurants/:restaurantId/available-tables
// Query: date=2026-05-15&start_time=19:00:00&end_time=21:00:00&guests=2
router.get('/available-tables', async (req: Request, res: Response): Promise<void> => {
  try {
    const { restaurantId } = req.params;
    const { date, start_time, end_time, guests = '1' } = req.query;

    if (!date || !start_time || !end_time) {
      res.status(400).json({ statusCode: 400, error: 'Bad Request', message: 'date, start_time and end_time query params are required' });
      return;
    }

    const minGuests = parseInt(guests as string, 10);

    // 1. Find all active tables for restaurant with sufficient capacity
    const allTables = await tableRepo.find({
      where: { restaurant_id: restaurantId, is_active: true }
    });
    const candidateTables = allTables.filter((t) => t.capacity >= minGuests);

    // 2. Find reservations on that date overlapping with requested interval
    const busyReservations = await reservationRepo
      .createQueryBuilder('r')
      .where('r.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('r.reservation_date = :date', { date })
      .andWhere('r.status != :cancelled', { cancelled: ReservationStatus.CANCELLED })
      .andWhere('NOT (r.end_time <= :start_time OR r.start_time >= :end_time)', {
        start_time,
        end_time
      })
      .getMany();

    const busyTableIds = new Set(busyReservations.map((r) => r.table_id));
    const availableTables = candidateTables.filter((t) => !busyTableIds.has(t.id));

    res.status(200).json(availableTables);
  } catch (err: any) {
    res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
  }
});

export default router;
