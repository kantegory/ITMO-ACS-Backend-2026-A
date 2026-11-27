import 'reflect-metadata';
import { app } from './app';
import { AppDataSource } from './config/database';
import { settings } from './config/settings';

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log('Company Service: Database connected');

    app.listen(settings.port, () => {
      console.log(`Company Service running on http://localhost:${settings.port}`);
      console.log(`  Health: http://localhost:${settings.port}/health`);
    });
  } catch (error) {
    console.error('Company Service failed to start:', error);
    process.exit(1);
  }
}

bootstrap();