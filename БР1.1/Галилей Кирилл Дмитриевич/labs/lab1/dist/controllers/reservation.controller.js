"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../config/data-source");
const reservation_entity_1 = require("../models/reservation.entity");
const table_entity_1 = require("../models/table.entity");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const reservationRepo = data_source_1.AppDataSource.getRepository(reservation_entity_1.Reservation);
const tableRepo = data_source_1.AppDataSource.getRepository(table_entity_1.RestaurantTable);
// POST /api/v1/reservations
router.post('/', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const { restaurant_id, table_id, reservation_date, start_time, end_time, guests_count, special_requests } = req.body;
        if (!restaurant_id || !table_id || !reservation_date || !start_time || !end_time) {
            res.status(400).json({ statusCode: 400, error: 'Bad Request', message: 'Missing required reservation fields' });
            return;
        }
        const table = await tableRepo.findOne({ where: { id: table_id, restaurant_id } });
        if (!table) {
            res.status(404).json({ statusCode: 404, error: 'Not Found', message: 'Selected table not found in this restaurant' });
            return;
        }
        if (guests_count && table.capacity < guests_count) {
            res.status(400).json({ statusCode: 400, error: 'Bad Request', message: `Table capacity is ${table.capacity}, but requested for ${guests_count} guests` });
            return;
        }
        // Protection against overbooking:
        const conflict = await reservationRepo
            .createQueryBuilder('r')
            .where('r.table_id = :table_id', { table_id })
            .andWhere('r.reservation_date = :reservation_date', { reservation_date })
            .andWhere('r.status != :cancelled', { cancelled: reservation_entity_1.ReservationStatus.CANCELLED })
            .andWhere('NOT (r.end_time <= :start_time OR r.start_time >= :end_time)', {
            start_time,
            end_time
        })
            .getOne();
        if (conflict) {
            res.status(409).json({
                statusCode: 409,
                error: 'Conflict',
                message: 'The selected table is already reserved for this time interval'
            });
            return;
        }
        const reservation = reservationRepo.create({
            user_id: req.user.id,
            restaurant_id,
            table_id,
            reservation_date,
            start_time,
            end_time,
            guests_count: guests_count || 2,
            special_requests,
            status: reservation_entity_1.ReservationStatus.CONFIRMED
        });
        await reservationRepo.save(reservation);
        res.status(201).json(reservation);
    }
    catch (err) {
        res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
});
// GET /api/v1/reservations/my
router.get('/my', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const reservations = await reservationRepo.find({
            where: { user_id: req.user.id },
            relations: ['restaurant', 'table'],
            order: { reservation_date: 'DESC', start_time: 'DESC' }
        });
        res.status(200).json(reservations);
    }
    catch (err) {
        res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
});
// GET /api/v1/reservations/:id
router.get('/:id', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const reservation = await reservationRepo.findOne({
            where: { id: req.params.id },
            relations: ['restaurant', 'table', 'user']
        });
        if (!reservation) {
            res.status(404).json({ statusCode: 404, error: 'Not Found', message: 'Reservation not found' });
            return;
        }
        res.status(200).json(reservation);
    }
    catch (err) {
        res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
});
// PATCH /api/v1/reservations/:id/status
router.patch('/:id/status', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const reservation = await reservationRepo.findOne({ where: { id: req.params.id } });
        if (!reservation) {
            res.status(404).json({ statusCode: 404, error: 'Not Found', message: 'Reservation not found' });
            return;
        }
        reservation.status = status;
        await reservationRepo.save(reservation);
        res.status(200).json(reservation);
    }
    catch (err) {
        res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
});
exports.default = router;
