/**
 * Проверяет корректность спецификации OpenAPI (ДЗ2).
 * Запуск: npm run validate:openapi
 */
import path from 'path';
import SwaggerParser from '@apidevtools/swagger-parser';

const SPEC = path.resolve(__dirname, '..', 'docs', 'openapi.yaml');

const main = async (): Promise<void> => {
  const api = (await SwaggerParser.validate(SPEC)) as any;
  const paths = Object.keys(api.paths ?? {});
  const operations = paths.reduce((total, key) => {
    const methods = ['get', 'post', 'put', 'patch', 'delete'];
    return total + methods.filter((method) => api.paths[key][method]).length;
  }, 0);
  console.log(`[openapi] спецификация валидна: ${api.info.title} ${api.info.version}`);
  console.log(`[openapi] путей: ${paths.length}, операций: ${operations}, схем: ${Object.keys(api.components?.schemas ?? {}).length}`);
};

main().catch((error) => {
  console.error('[openapi] ошибка валидации:', error.message);
  process.exit(1);
});
