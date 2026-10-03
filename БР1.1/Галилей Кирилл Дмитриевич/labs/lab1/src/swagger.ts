import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import fs from 'fs';

export const setupSwagger = (app: Application): void => {
  try {
    const candidates = [
      path.resolve(__dirname, '../../../homeworks/hw2/openapi.yaml'),
      path.resolve(process.cwd(), '../../homeworks/hw2/openapi.yaml'),
      path.resolve(__dirname, '../../../../homeworks/hw2/openapi.yaml'),
    ];
    let openapiPath = candidates[0];
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        openapiPath = cand;
        break;
      }
    }
    const swaggerDoc = YAML.load(openapiPath);
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
    console.log('Swagger UI is available at /docs and /api/docs');
  } catch (err) {
    console.warn('Could not load openapi.yaml for Swagger UI:', err);
  }
};
