"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../config/data-source");
const menu_item_entity_1 = require("../models/menu-item.entity");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const user_entity_1 = require("../models/user.entity");
const router = (0, express_1.Router)({ mergeParams: true });
const menuRepo = data_source_1.AppDataSource.getRepository(menu_item_entity_1.MenuItem);
// GET /api/v1/restaurants/:restaurantId/menu
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        const where = { restaurant_id: req.params.restaurantId, is_available: true };
        if (category) {
            where.category = category;
        }
        const items = await menuRepo.find({ where, order: { category: 'ASC', name: 'ASC' } });
        res.status(200).json(items);
    }
    catch (err) {
        res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
});
// POST /api/v1/restaurants/:restaurantId/menu
router.post('/', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)([user_entity_1.UserRole.MANAGER, user_entity_1.UserRole.ADMIN]), async (req, res) => {
    try {
        const { name, description, price, category } = req.body;
        const item = menuRepo.create({
            restaurant_id: req.params.restaurantId,
            name,
            description,
            price,
            category: category || menu_item_entity_1.MenuCategory.MAIN,
            is_available: true
        });
        await menuRepo.save(item);
        res.status(201).json(item);
    }
    catch (err) {
        res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
});
exports.default = router;
