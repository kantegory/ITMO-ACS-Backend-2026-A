import { app } from './app';
import { settings } from './config/settings';

async function bootstrap() {
  app.listen(settings.port, () => {
    console.log(`API Gateway running on http://localhost:${settings.port}`);
    console.log(`   Health: http://localhost:${settings.port}/health`);
    console.log(`   Routes:`);
    console.log(`     POST /api/v1/auth/register -> User Service`);
    console.log(`     POST /api/v1/auth/login -> User Service`);
    console.log(`     GET  /api/v1/users/profile -> User Service`);
    console.log(`     GET  /api/v1/companies -> Company Service`);
    console.log(`     GET  /api/v1/services -> Company Service`);
    console.log(`     POST /api/v1/requests -> Order Service`);
    console.log(`     GET  /api/v1/me/requests -> Order Service`);
    console.log(`     GET  /api/v1/admin/* -> Analytics Service`);
  });
}

bootstrap();