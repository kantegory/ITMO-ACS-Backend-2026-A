import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { databaseEnv } from '../shared/env';
import { Notification } from './entities/notification.entity';
import { NotificationSetting } from './entities/notification-setting.entity';

const db = databaseEnv('NOTIFICATION');

export const notificationDataSource = new DataSource({
  type: 'postgres',
  ...db,
  entities: [Notification, NotificationSetting],
  synchronize: true,
  logging: false,
});
