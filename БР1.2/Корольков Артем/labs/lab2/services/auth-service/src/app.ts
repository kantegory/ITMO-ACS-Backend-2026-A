import express from 'express';
import sequelize from './config/db';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import internalRoutes from './routes/internal';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(express.json());
app.get('/', (_req, res) => {
  res.json({
    service: 'auth-service',
    status: 'ok',
    note: 'Use API Gateway http://localhost:3010 for client requests',
    endpoints: ['/health', '/auth/register', '/auth/login', '/users/me']
  });
});
app.get('/health', (_req, res) => res.json({ service: 'auth-service', status: 'ok' }));
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/internal', internalRoutes);

sequelize
  .sync()
  .then(() => {
    const server = app.listen(PORT, () => console.log(`Auth service: http://localhost:${PORT}`));
    server.on('error', (err: NodeJS.ErrnoException) => {
      console.error(`Auth service failed on port ${PORT}:`, err.message);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('Auth DB sync failed:', err);
    process.exit(1);
  });
