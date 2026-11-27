import 'reflect-metadata';
import { App } from './app';
import { settings } from './config/settings';

async function bootstrap() {
  console.log('Starting Sangel API...');
  console.log(`Environment: ${settings.nodeEnv}`);
  
  const appInstance = new App();
  
  try {
    await appInstance.initialize();
    
    const app = appInstance.getApp();
    
    app.listen(settings.port, () => {
      console.log(`Server running on http://localhost:${settings.port}`);
      console.log(`Health check: http://localhost:${settings.port}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();