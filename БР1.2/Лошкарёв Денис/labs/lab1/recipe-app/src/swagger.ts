import swaggerAutogen from 'swagger-autogen';
import * as path from 'path';

const doc = {
  openapi: '3.0.0', // Обязательно указываем версию 3.0.0
  info: {
    title: 'Recipe Exchange API',
    version: '1.0.0',
    description: 'API для сервиса рецептов'
  },
  host: 'localhost:3000',
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};

const outputFile = path.join(process.cwd(), 'swagger-output.json');
const endpointsFiles = [path.join(process.cwd(), 'src/index.ts')];

// Генерируем с поддержкой OpenAPI 3
swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc);