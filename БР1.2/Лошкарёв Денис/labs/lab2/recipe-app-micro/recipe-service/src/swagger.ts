import swaggerAutogen from 'swagger-autogen';
import path from 'path';

const doc = {
  info: { title: 'Recipe Service API', version: '1.0.0' },
  host: 'localhost:3000',
  basePath: '/',
  schemes: ['http'],
   securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'Введите токен в формате: Bearer <ваш_токен>'
    }
  },
  security: [ { bearerAuth: [] } ]
};

const outputFile = path.join(process.cwd(), 'swagger-output.json');
const endpointsFiles = [path.join(process.cwd(), 'src/index.ts')];

swaggerAutogen()(outputFile, endpointsFiles, doc);