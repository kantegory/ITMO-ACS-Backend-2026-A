import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import dataSource from './data-source';
import AuthController from './controllers/auth.controller';
import UserController from './controllers/user.controller';
import InternalController from './controllers/internal.controller';

const PORT = parseInt(process.env.IDENTITY_PORT || '8001');
const SERVICE = 'identity-service';

let app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (_req, res) => res.json({ service: SERVICE, status: 'ok' }));

app = useExpressServer(app, {
    controllers: [AuthController, UserController, InternalController],
    validation: true,
    classTransformer: true,
    defaultErrorHandler: true,
});

dataSource
    .initialize()
    .then(() => {
        console.log(`[${SERVICE}] DB (users_db) initialized`);
        app.listen(PORT, () => console.log(`[${SERVICE}] listening on http://localhost:${PORT}`));
    })
    .catch((err) => console.error(`[${SERVICE}] DB init error:`, err));
