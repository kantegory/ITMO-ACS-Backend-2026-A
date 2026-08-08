import 'reflect-metadata';
import { envInt } from '../shared/env';
import { createServiceApp, finishServiceApp } from '../shared/app';
import {
  AuthenticatedRequest,
  currentUser,
  requireGatewayUser,
  requireInternalToken,
} from '../shared/auth-context';
import {
  asyncHandler,
  HttpError,
  pagination,
  parsePositiveInt,
  requireString,
} from '../shared/http';
import { startService } from '../shared/start';
import { notificationDataSource } from './data-source';
import { Notification } from './entities/notification.entity';
import { NotificationSetting } from './entities/notification-setting.entity';

const app = createServiceApp('notification-service');
const port = envInt('NOTIFICATION_PORT', 3007);

app.post(
  '/api/internal/notifications',
  requireInternalToken,
  asyncHandler(async (req, res) => {
    const repository = notificationDataSource.getRepository(Notification);
    const notification = await repository.save(
      repository.create({
        userId: parsePositiveInt(req.body.userId, 'userId'),
        type: requireString(req.body.type, 'type'),
        title: requireString(req.body.title, 'title'),
        message: requireString(req.body.message, 'message'),
        status: 'created',
        sentAt: new Date(),
      }),
    );
    res.status(201).json({ notification });
  }),
);

app.get(
  '/api/users/me/notifications',
  requireGatewayUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = currentUser(req);
    const repository = notificationDataSource.getRepository(Notification);
    const { page, pageSize, skip } = pagination(req.query);
    const [items, totalItems] = await repository.findAndCount({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });
    res.json({
      items,
      pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
    });
  }),
);

app.patch(
  '/api/users/me/notifications/:id/read',
  requireGatewayUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = currentUser(req);
    const id = parsePositiveInt(req.params.id, 'id');
    const repository = notificationDataSource.getRepository(Notification);
    const notification = await repository.findOneBy({ id, userId: user.id });
    if (!notification) {
      throw new HttpError(404, 'Notification not found', 'NOTIFICATION_NOT_FOUND');
    }
    notification.status = 'read';
    notification.readAt = new Date();
    await repository.save(notification);
    res.json({ notification });
  }),
);

app.get(
  '/api/users/me/notification-settings',
  requireGatewayUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = currentUser(req);
    const repository = notificationDataSource.getRepository(NotificationSetting);
    let settings = await repository.findOneBy({ userId: user.id });
    if (!settings) settings = await repository.save(repository.create({ userId: user.id }));
    res.json({ settings });
  }),
);

app.patch(
  '/api/users/me/notification-settings',
  requireGatewayUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = currentUser(req);
    const repository = notificationDataSource.getRepository(NotificationSetting);
    let settings = await repository.findOneBy({ userId: user.id });
    if (!settings) settings = repository.create({ userId: user.id });
    const fields = ['emailEnabled', 'pushEnabled', 'workoutRemindersEnabled'] as const;
    for (const field of fields) {
      if (req.body[field] !== undefined) settings[field] = Boolean(req.body[field]);
    }
    await repository.save(settings);
    res.json({ settings });
  }),
);

finishServiceApp(app);

void startService(app, notificationDataSource, port, 'notification-service').catch((error) => {
  console.error(error);
  process.exit(1);
});
