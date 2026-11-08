import express from 'express';
import sequelize from './config/db';
import { RABBITMQ_ENABLED } from '../../shared/src/config';
import { startRestaurantMessaging } from './messaging/consumer';
import './models';
import restaurantRoutes from './routes/restaurants';
import internalRoutes from './routes/internal';

const app = express();
const PORT = Number(process.env.PORT) || 3002;

app.use(express.json());
app.get('/', (_req, res) => {
  res.json({
    service: 'restaurant-service',
    status: 'ok',
    note: 'Use API Gateway http://localhost:3010 for client requests',
    endpoints: ['/health', '/restaurants', '/restaurants/:id']
  });
});
app.get('/health', (_req, res) => res.json({ service: 'restaurant-service', status: 'ok' }));
app.use('/restaurants', restaurantRoutes);
app.use('/internal', internalRoutes);

async function bootstrap() {
  await sequelize.sync();
  if (RABBITMQ_ENABLED) {
    await startRestaurantMessaging();
  }
  const server = app.listen(PORT, () => console.log(`Restaurant service: http://localhost:${PORT}`));
  server.on('error', (err: NodeJS.ErrnoException) => {
    console.error(`Restaurant service failed on port ${PORT}:`, err.message);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Restaurant service bootstrap failed:', err);
  process.exit(1);
});
