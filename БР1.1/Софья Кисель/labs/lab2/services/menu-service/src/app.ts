import 'reflect-metadata';
import express from 'express';
import cors from 'cors';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { Menu } from './models/menu.entity';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

app.get(`${SETTINGS.APP_API_PREFIX}/restaurants/:restaurantId/menu`, async (req, res) => {
    try {
        const restaurantId = Number(req.params.restaurantId);

        if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
            return res.status(400).json({ message: 'Invalid restaurant ID' });
        }

        const menus = await dataSource.getRepository(Menu).find({
            where: { restaurant_id: restaurantId },
            relations: ['menuItems'],
        });

        return res.json(menus);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

dataSource.initialize()
    .then(() => {
        app.listen(SETTINGS.APP_PORT, SETTINGS.APP_HOST, () => {
            console.log(`Menu service listening on ${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to connect to menu database:', error);
        process.exit(1);
    });
