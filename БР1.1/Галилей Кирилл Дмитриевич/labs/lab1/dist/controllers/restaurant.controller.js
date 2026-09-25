"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../config/data-source");
const restaurant_entity_1 = require("../models/restaurant.entity");
const user_entity_1 = require("../models/user.entity");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const restaurantRepo = data_source_1.AppDataSource.getRepository(restaurant_entity_1.Restaurant);
// GET /api/v1/restaurants
router.get('/', async (req, res) => {
    try {
        const { cuisine, city, price_range, search, limit = '10', offset = '0' } = req.query;
        const query = restaurantRepo.createQueryBuilder('r')
            .leftJoinAndSelect('r.tables', 'tables')
            .leftJoinAndSelect('r.menu_items', 'menu_items')
            .leftJoinAndSelect('r.reviews', 'reviews');
        if (cuisine) {
            query.andWhere('r.cuisine_type ILIKE :cuisine', { cuisine: `%${cuisine}%` });
        }
        if (city) {
            query.andWhere('r.city ILIKE :city', { city: `%${city}%` });
        }
        if (price_range) {
            query.andWhere('r.price_range = :price', { price: parseInt(price_range, 10) });
        }
        if (search) {
            query.andWhere('(r.name ILIKE :search OR r.description ILIKE :search)', { search: `%${search}%` });
        }
        const [items, total] = await query
            .take(parseInt(limit, 10))
            .skip(parseInt(offset, 10))
            .getManyAndCount();
        res.status(200).json({ total, items });
    }
    catch (err) {
        res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
});
// GET /api/v1/restaurants/:id
router.get('/:id', async (req, res) => {
    try {
        const restaurant = await restaurantRepo.findOne({
            where: { id: req.params.id },
            relations: ['tables', 'menu_items', 'reviews', 'reviews.user']
        });
        if (!restaurant) {
            res.status(404).json({ statusCode: 404, error: 'Not Found', message: 'Restaurant not found' });
            return;
        }
        res.status(200).json(restaurant);
    }
    catch (err) {
        res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
});
// POST /api/v1/restaurants (Manager or Admin)
router.post('/', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)([user_entity_1.UserRole.MANAGER, user_entity_1.UserRole.ADMIN]), async (req, res) => {
    try {
        const { name, description, cuisine_type, price_range, address, city, phone, opening_time, closing_time, photo_url } = req.body;
        const restaurant = restaurantRepo.create({
            name,
            description,
            cuisine_type,
            price_range: price_range || 2,
            address,
            city,
            phone,
            opening_time: opening_time || '10:00:00',
            closing_time: closing_time || '23:00:00',
            photo_url,
            manager_id: req.user.id
        });
        await restaurantRepo.save(restaurant);
        res.status(201).json(restaurant);
    }
    catch (err) {
        res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
});
// PUT /api/v1/restaurants/:id
router.put('/:id', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)([user_entity_1.UserRole.MANAGER, user_entity_1.UserRole.ADMIN]), async (req, res) => {
    try {
        const restaurant = await restaurantRepo.findOne({ where: { id: req.params.id } });
        if (!restaurant) {
            res.status(404).json({ statusCode: 404, error: 'Not Found', message: 'Restaurant not found' });
            return;
        }
        Object.assign(restaurant, req.body);
        await restaurantRepo.save(restaurant);
        res.status(200).json(restaurant);
    }
    catch (err) {
        res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
});
exports.default = router;
