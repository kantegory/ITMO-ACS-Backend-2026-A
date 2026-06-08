import 'reflect-metadata';
import { app } from './app';
import { AppDataSource } from './config/database';
import { settings } from './config/settings';
import { setupExchanges } from '../event-bus';

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log('User Service: Database connected');

    await setupExchanges();
    console.log('Company Service: RabbitMQ exchanges configured');

    app.listen(settings.port, () => {
      console.log(`User Service running on http://localhost:${settings.port}`);
      console.log(`   Health: http://localhost:${settings.port}/health`);
      console.log(`   API: http://localhost:${settings.port}/api/v1`);
    });
  } catch (error) {
    console.error('User Service failed to start:', error);
    process.exit(1);
  }
}

bootstrap();