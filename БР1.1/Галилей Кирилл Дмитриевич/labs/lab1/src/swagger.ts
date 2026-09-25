import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

export const setupSwagger = (app: Application): void => {
  try {
    const openapiPath = path.resolve(__dirname, '../../../../homeworks/hw2/openapi.yaml');
    const swaggerDoc = YAML.load(openapiPath);
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
    console.log('Swagger UI is available at /docs');
  } catch (err) {
    console.warn('Could not load openapi.yaml for Swagger UI:', err);
  }
};
