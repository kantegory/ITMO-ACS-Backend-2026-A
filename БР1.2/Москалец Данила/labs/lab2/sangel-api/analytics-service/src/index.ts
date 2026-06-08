import 'reflect-metadata';
import { app } from './app';
import { settings } from './config/settings';

async function bootstrap() {
  try {
    console.log('Analytics Service: No database (aggregates from other services)');

    app.listen(settings.port, () => {
      console.log(`Analytics Service running on http://localhost:${settings.port}`);
      console.log(`   Health: http://localhost:${settings.port}/health`);
      console.log(`   Admin API: http://localhost:${settings.port}/api/v1/admin`);
    });
  } catch (error) {
    console.error('Analytics Service failed to start:', error);
    process.exit(1);
  }
}

bootstrap();