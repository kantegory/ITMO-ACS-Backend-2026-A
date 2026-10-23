import './tz';
import 'reflect-metadata';
import express from 'express';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Get, JsonController, useExpressServer } from 'routing-controllers';

import { ctx } from './registry';
import { fail } from './errors';
import { Jwks, makeServiceGuard } from './auth';
import { errorHandler, notFoundHandler, requestIdMiddleware } from './middlewares';
import { InboxEvent, OutboxEvent } from './outbox';

export const makeDataSource = (entities: Function[]) =>
    new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: [...entities, OutboxEvent, InboxEvent],
        namingStrategy: new SnakeNamingStrategy(),
        synchronize: process.env.DB_SYNCHRONIZE !== 'false',
        logging: process.env.DB_LOGGING === 'true',
    });

// GET /internal/v1/health есть у каждого сервиса
@JsonController('/internal/v1/health')
export class HealthController {
    @Get('')
    async health() {
        try { await ctx.dataSource!.query('SELECT 1'); } catch (_e) { throw fail('SERVICE_UNAVAILABLE'); }
        return { service: ctx.name, status: 'ok', version: '1.0.0', database: 'ok', broker: null };
    }
}

export interface ServiceOptions {
    name: string;
    port: number;
    controllers: Function[];
    dataSource: DataSource;
    jwks: Jwks;
    publicInternal?: string[];
    onReady?: () => Promise<void>;
}

export async function startService(o: ServiceOptions) {
    ctx.name = o.name;
    ctx.dataSource = o.dataSource;
    const app = express();
    app.use(express.json());
    app.use(requestIdMiddleware);
    app.use('/internal/v1', makeServiceGuard(o.jwks, o.name, ['/health', ...(o.publicInternal || [])]));
    useExpressServer(app, {
        controllers: [...o.controllers, HealthController],
        validation: { whitelist: true },
        classTransformer: true,
        defaultErrorHandler: false,
    });
    app.use(notFoundHandler);
    app.use(errorHandler);

    // БД может подняться позже сервиса: пробуем подключиться несколько раз
    for (let i = 1; ; i++) {
        try { await o.dataSource.initialize(); break; }
        catch (e: any) {
            if (i >= 30) throw e;
            console.warn(`[${o.name}] БД недоступна (${e.message}), попытка ${i}`);
            await new Promise((r) => setTimeout(r, 2000));
        }
    }
    console.log(`[${o.name}] БД подключена`);
    if (o.onReady) await o.onReady();
    app.listen(o.port, '0.0.0.0', () => console.log(`[${o.name}] запущен на порту ${o.port}`));
}
