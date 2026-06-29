const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const controller = require('../controllers/notification.controller');

const router = express.Router();

router.get('/notifications/my', authMiddleware, controller.getMyNotifications);
router.get('/notifications', authMiddleware, requireRole('admin'), controller.getAllNotifications);
router.patch('/notifications/:notificationId/read', authMiddleware, controller.markNotificationAsRead);

module.exports = router;
