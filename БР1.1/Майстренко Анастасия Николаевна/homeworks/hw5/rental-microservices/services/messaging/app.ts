import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import dataSource from './data-source';
import { connectBroker } from '../../shared/broker';
import { startMessagingConsumers } from './events';
import ConversationController from './controllers/conversation.controller';

const PORT = parseInt(process.env.MESSAGING_PORT || '8004');
const SERVICE = 'messaging-service';

let app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (_req, res) => res.json({ service: SERVICE, status: 'ok' }));

app = useExpressServer(app, {
    controllers: [ConversationController],
    validation: true,
    classTransformer: true,
    defaultErrorHandler: true,
});

dataSource
    .initialize()
    .then(async () => {
        console.log(`[${SERVICE}] DB (messaging_db) initialized`);
        await connectBroker(SERVICE);
        await startMessagingConsumers(); // подписка на booking.confirmed
        app.listen(PORT, () => console.log(`[${SERVICE}] listening on http://localhost:${PORT}`));
    })
    .catch((err) => console.error(`[${SERVICE}] DB init error:`, err));
