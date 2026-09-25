"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../config/data-source");
const review_entity_1 = require("../models/review.entity");
const restaurant_entity_1 = require("../models/restaurant.entity");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)({ mergeParams: true });
const reviewRepo = data_source_1.AppDataSource.getRepository(review_entity_1.Review);
const restaurantRepo = data_source_1.AppDataSource.getRepository(restaurant_entity_1.Restaurant);
// GET /api/v1/restaurants/:restaurantId/reviews
router.get('/', async (req, res) => {
    try {
        const reviews = await reviewRepo.find({
            where: { restaurant_id: req.params.restaurantId },
            relations: ['user'],
            order: { created_at: 'DESC' }
        });
        res.status(200).json(reviews);
    }
    catch (err) {
        res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
});
// POST /api/v1/restaurants/:restaurantId/reviews
router.post('/', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const restaurantId = req.params.restaurantId;
        if (!rating || rating < 1 || rating > 5) {
            res.status(400).json({ statusCode: 400, error: 'Bad Request', message: 'Rating must be an integer between 1 and 5' });
            return;
        }
        const review = reviewRepo.create({
            user_id: req.user.id,
            restaurant_id: restaurantId,
            rating,
            comment
        });
        await reviewRepo.save(review);
        // Recalculate average restaurant rating
        const allReviews = await reviewRepo.find({ where: { restaurant_id: restaurantId } });
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await restaurantRepo.update(restaurantId, { rating: Math.round(avg * 100) / 100 });
        res.status(201).json(review);
    }
    catch (err) {
        res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
});
exports.default = router;
