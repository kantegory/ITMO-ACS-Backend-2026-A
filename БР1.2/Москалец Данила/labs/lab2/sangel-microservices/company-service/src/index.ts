import 'reflect-metadata';
import { app } from './app';
import { AppDataSource } from './config/database';
import { settings } from './config/settings';
import { setupExchanges } from '../event-bus';
import { startCompanyConsumer } from './consumers/user.consumer';

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log('Company Service: Database connected');

    await setupExchanges();
    console.log('Company Service: RabbitMQ exchanges configured');
    
    await startCompanyConsumer();
    console.log('Company Service: Consumer started');

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