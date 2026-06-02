import express from 'express';
import sequelize from './config/db';
import { RABBITMQ_ENABLED } from '../../shared/src/config';
import { startReservationMessaging } from './messaging/consumer';
import reservationRoutes from './routes/reservations';
import restaurantRoutes from './routes/restaurants';
import userRoutes from './routes/users';

const app = express();
const PORT = Number(process.env.PORT) || 3003;

app.use(express.json());
app.get('/', (_req, res) => {
  res.json({
    service: 'reservation-service',
    status: 'ok',
    note: 'Use API Gateway http://localhost:3010 for client requests',
    endpoints: ['/health', '/reservations', '/restaurants/:id/reservations', '/users/me/reservations']
  });
});
app.get('/health', (_req, res) => res.json({ service: 'reservation-service', status: 'ok' }));
app.use('/reservations', reservationRoutes);
app.use('/restaurants', restaurantRoutes);
app.use('/users', userRoutes);

async function bootstrap() {
  await sequelize.sync();
  if (RABBITMQ_ENABLED) {
    await startReservationMessaging();
  }
  const server = app.listen(PORT, () => console.log(`Reservation service: http://localhost:${PORT}`));
  server.on('error', (err: NodeJS.ErrnoException) => {
    console.error(`Reservation service failed on port ${PORT}:`, err.message);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Reservation service bootstrap failed:', err);
  process.exit(1);
});
