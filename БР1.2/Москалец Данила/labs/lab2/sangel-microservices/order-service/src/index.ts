import 'reflect-metadata';
import { app } from './app';
import { AppDataSource } from './config/database';
import { settings } from './config/settings';
import { setupExchanges } from '../event-bus';

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log('Order Service: Database connected');

    await setupExchanges();
    console.log('Order Service: RabbitMQ exchanges configured');

    app.listen(settings.port, () => {
      console.log(`Order Service running on http://localhost:${settings.port}`);
      console.log(`   Health: http://localhost:${settings.port}/health`);
    });
  } catch (error) {
    console.error('Order Service failed to start:', error);
    process.exit(1);
  }
}

bootstrap();