import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import dataSource from './data-source';
import PropertyController from './controllers/property.controller';
import AmenityController from './controllers/amenity.controller';
import CatalogInternalController from './controllers/internal.controller';

const PORT = parseInt(process.env.CATALOG_PORT || '8002');
const SERVICE = 'catalog-service';

let app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (_req, res) => res.json({ service: SERVICE, status: 'ok' }));

app = useExpressServer(app, {
    controllers: [PropertyController, AmenityController, CatalogInternalController],
    validation: true,
    classTransformer: true,
    defaultErrorHandler: true,
});

dataSource
    .initialize()
    .then(() => {
        console.log(`[${SERVICE}] DB (catalog_db) initialized`);
        app.listen(PORT, () => console.log(`[${SERVICE}] listening on http://localhost:${PORT}`));
    })
    .catch((err) => console.error(`[${SERVICE}] DB init error:`, err));
