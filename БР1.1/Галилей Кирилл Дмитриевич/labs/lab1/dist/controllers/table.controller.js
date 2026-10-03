"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../config/data-source");
const table_entity_1 = require("../models/table.entity");
const reservation_entity_1 = require("../models/reservation.entity");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const user_entity_1 = require("../models/user.entity");
const router = (0, express_1.Router)({ mergeParams: true });
const tableRepo = data_source_1.AppDataSource.getRepository(table_entity_1.RestaurantTable);
const reservationRepo = data_source_1.AppDataSource.getRepository(reservation_entity_1.Reservation);
// GET /api/v1/restaurants/:restaurantId/tables
router.get('/', async (req, res) => {
    try {
        const tables = await tableRepo.find({
            where: { restaurant_id: req.params.restaurantId, is_active: true },
            order: { table_number: 'ASC' }
        });
        res.status(200).json(tables);
    }
    catch (err) {
        res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
});
// POST /api/v1/restaurants/:restaurantId/tables
router.post('/', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)([user_entity_1.UserRole.MANAGER, user_entity_1.UserRole.ADMIN]), async (req, res) => {
    try {
        const { table_number, capacity, location_zone } = req.body;
        const table = tableRepo.create({
            restaurant_id: req.params.restaurantId,
            table_number,
            capacity,
            location_zone: location_zone || table_entity_1.TableZone.MAIN_HALL,
            is_active: true
        });
        await tableRepo.save(table);
        res.status(201).json(table);
    }
    catch (err) {
        res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
});
// GET /api/v1/restaurants/:restaurantId/available-tables
// Query: date=2026-05-15&start_time=19:00:00&end_time=21:00:00&guests=2
router.get('/available-tables', async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { date, start_time, end_time, guests = '1' } = req.query;
        if (!date || !start_time || !end_time) {
            res.status(400).json({ statusCode: 400, error: 'Bad Request', message: 'date, start_time and end_time query params are required' });
            return;
        }
        const minGuests = parseInt(guests, 10);
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
            .andWhere('r.status != :cancelled', { cancelled: reservation_entity_1.ReservationStatus.CANCELLED })
            .andWhere('NOT (r.end_time <= :start_time OR r.start_time >= :end_time)', {
            start_time,
            end_time
        })
            .getMany();
        const busyTableIds = new Set(busyReservations.map((r) => r.table_id));
        const availableTables = candidateTables.filter((t) => !busyTableIds.has(t.id));
        res.status(200).json(availableTables);
    }
    catch (err) {
        res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
});
exports.default = router;
