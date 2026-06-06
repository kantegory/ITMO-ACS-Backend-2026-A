import 'reflect-metadata';
import { AppDataSource } from './config/database';
import app from './app';

const PORT = parseInt(process.env.PORT || '3000');

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected');
    app.listen(PORT, () => {
      console.log(`user-service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
