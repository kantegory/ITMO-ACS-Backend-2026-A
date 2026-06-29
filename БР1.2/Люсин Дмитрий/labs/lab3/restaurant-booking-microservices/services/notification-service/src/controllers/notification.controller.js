const { Notification } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { notificationView } = require('../views/notification.view');

const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.findAll({
    where: { user_id: req.user.id },
    order: [['id', 'DESC']]
  });

  res.json({ data: notifications.map(notificationView) });
});

const getAllNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.findAll({ order: [['id', 'DESC']] });
  res.json({ data: notifications.map(notificationView) });
});

const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByPk(req.params.notificationId);

  if (!notification) {
    throw new ApiError(404, 'Уведомление не найдено');
  }

  if (req.user.role !== 'admin' && notification.user_id !== req.user.id) {
    throw new ApiError(403, 'Нет доступа к этому уведомлению');
  }

  notification.is_read = true;
  await notification.save();

  res.json({ notification: notificationView(notification) });
});

module.exports = { getMyNotifications, getAllNotifications, markNotificationAsRead };
