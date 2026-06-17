import 'reflect-metadata';
import { AppDataSource } from './config/database';
import { runSeed } from './seed';
import app from './app';

const PORT = parseInt(process.env.PORT || '3000');

AppDataSource.initialize()
  .then(async () => {
    console.log('Database connected');
    await runSeed(AppDataSource);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
