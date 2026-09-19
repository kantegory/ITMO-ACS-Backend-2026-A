import 'dotenv/config';
import 'reflect-metadata';

import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import AuthController from './controllers/auth.controller';

const app = express();

app.use(cors());

useExpressServer(app, {
    routePrefix: SETTINGS.APP_API_PREFIX,
    controllers: [AuthController],
});

dataSource
    .initialize()
    .then(() => {
        app.listen(SETTINGS.APP_PORT, SETTINGS.APP_HOST, () => {
            console.log(
                `Auth Service started on ${SETTINGS.APP_PROTOCOL}://${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}`,
            );
        });
    })
    .catch((error) => {
        console.error('Database connection failed:', error);
        process.exit(1);
    });
