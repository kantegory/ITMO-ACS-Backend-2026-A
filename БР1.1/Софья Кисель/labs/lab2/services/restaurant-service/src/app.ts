import 'reflect-metadata';
import 'dotenv/config';

import express from 'express';
import cors from 'cors';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { Restaurant } from './models/restaurant.entity';

async function bootstrap() {
    const app = express();

    app.use(cors());
    app.use(express.json());

    await dataSource.initialize();

    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', service: 'restaurant-service' });
    });

    app.get('/api/v1/restaurants', async (_req, res) => {
        try {
            const restaurants = await dataSource
                .getRepository(Restaurant)
                .find();

            res.json(restaurants);
        } catch (error) {
            console.error('Failed to fetch restaurants:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    app.listen(SETTINGS.APP_PORT, SETTINGS.APP_HOST, () => {
        console.log(
            `Restaurant service is running at ${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}`,
        );
    });
}

bootstrap().catch((error) => {
    console.error('Failed to start restaurant-service:', error);
    process.exit(1);
});
