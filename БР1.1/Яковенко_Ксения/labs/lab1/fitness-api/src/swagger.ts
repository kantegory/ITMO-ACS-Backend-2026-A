import { Express } from 'express';
import * as swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';

export function useSwagger(app: Express): Express {
  try {
    const openApiPath = path.join(process.cwd(), 'openapi.json');
    let raw = fs.readFileSync(openApiPath, 'utf-8');

    raw = raw.replace(/^\uFEFF/, '').trim();

    const spec = JSON.parse(raw);

    app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

    return app;
  } catch (error) {
    console.error('Ошибка настройки Swagger:', error);
    return app;
  }
}