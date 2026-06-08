import 'reflect-metadata';
import { app } from './app';
import { settings } from './config/settings';
import { startAnalyticsConsumer } from './consumers/all.consumer';
import { setupExchanges } from '../event-bus';

async function bootstrap() {
  try {
    // Настраиваем RabbitMQ exchanges
    await setupExchanges();
    
    // Запускаем consumer для Analytics Service
    await startAnalyticsConsumer();
    
    console.log('Analytics Service: RabbitMQ connected');

    app.listen(settings.port, () => {
      console.log(`Analytics Service running on http://localhost:${settings.port}`);
    });
  } catch (error) {
    console.error('Analytics Service failed to start:', error);
    process.exit(1);
  }
}

bootstrap();