import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import dataSource from './data-source';
import { connectBroker } from '../../shared/broker';
import BookingController from './controllers/booking.controller';
import BookingInternalController from './controllers/internal.controller';

const PORT = parseInt(process.env.BOOKING_PORT || '8003');
const SERVICE = 'booking-service';

let app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (_req, res) => res.json({ service: SERVICE, status: 'ok' }));

app = useExpressServer(app, {
    controllers: [BookingController, BookingInternalController],
    validation: true,
    classTransformer: true,
    defaultErrorHandler: true,
});

dataSource
    .initialize()
    .then(async () => {
        console.log(`[${SERVICE}] DB (booking_db) initialized`);
        await connectBroker(SERVICE); // Booking — издатель событий
        app.listen(PORT, () => console.log(`[${SERVICE}] listening on http://localhost:${PORT}`));
    })
    .catch((err) => console.error(`[${SERVICE}] DB init error:`, err));
