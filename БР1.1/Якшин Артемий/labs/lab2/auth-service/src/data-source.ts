import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { dbOptions } from './db';

// SQLite (dev/compose) или PostgreSQL (k8s) — в зависимости от DATABASE_URL, см. db.ts
export const AppDataSource = new DataSource(dbOptions('./auth.sqlite', [User]));
