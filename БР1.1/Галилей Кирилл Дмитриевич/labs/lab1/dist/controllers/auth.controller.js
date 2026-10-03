"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const data_source_1 = require("../config/data-source");
const user_entity_1 = require("../models/user.entity");
const settings_1 = require("../config/settings");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const userRepo = data_source_1.AppDataSource.getRepository(user_entity_1.User);
// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name, phone, role } = req.body;
        if (!email || !password || !full_name) {
            res.status(400).json({ statusCode: 400, error: 'Bad Request', message: 'Email, password and full_name are required' });
            return;
        }
        const existing = await userRepo.findOne({ where: { email } });
        if (existing) {
            res.status(409).json({ statusCode: 409, error: 'Conflict', message: 'User with this email already exists' });
            return;
        }
        const salt = await bcrypt_1.default.genSalt(10);
        const password_hash = await bcrypt_1.default.hash(password, salt);
        const user = userRepo.create({
            email,
            password_hash,
            full_name,
            phone,
            role: role === 'manager' ? user_entity_1.UserRole.MANAGER : user_entity_1.UserRole.CUSTOMER
        });
        await userRepo.save(user);
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, settings_1.SETTINGS.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });
    }
    catch (err) {
        res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
});
// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ statusCode: 400, error: 'Bad Request', message: 'Email and password are required' });
            return;
        }
        const user = await userRepo
            .createQueryBuilder('u')
            .addSelect('u.password_hash')
            .where('u.email = :email', { email })
            .getOne();
        if (!user) {
            res.status(401).json({ statusCode: 401, error: 'Unauthorized', message: 'Invalid email or password' });
            return;
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password_hash);
        if (!isMatch) {
            res.status(401).json({ statusCode: 401, error: 'Unauthorized', message: 'Invalid email or password' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, settings_1.SETTINGS.JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });
    }
    catch (err) {
        res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
});
// GET /api/v1/auth/me
router.get('/me', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const user = await userRepo.findOne({ where: { id: req.user.id } });
        if (!user) {
            res.status(404).json({ statusCode: 404, error: 'Not Found', message: 'User not found' });
            return;
        }
        res.status(200).json(user);
    }
    catch (err) {
        res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
});
exports.default = router;
