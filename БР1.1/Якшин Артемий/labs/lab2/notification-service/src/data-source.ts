import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Notification } from './entities/Notification';
import { dbOptions } from './db';

// SQLite (dev/compose) или PostgreSQL (k8s) — в зависимости от DATABASE_URL, см. db.ts
export const AppDataSource = new DataSource(dbOptions('./notifications.sqlite', [Notification]));
