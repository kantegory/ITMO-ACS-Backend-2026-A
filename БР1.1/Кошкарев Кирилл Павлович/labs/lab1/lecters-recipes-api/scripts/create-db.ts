/**
 * Создаёт базу данных с UTF-8-локалью, если её ещё нет.
 * Локаль важна: в базе с LC_COLLATE=C оператор ILIKE не сворачивает регистр кириллицы,
 * и поиск по названию рецепта перестаёт работать.
 * Запуск: npm run db:create
 */
import { Client } from 'pg';
import { env } from '../src/config/env';

const main = async (): Promise<void> => {
  const client = new Client({
    host: env.db.host,
    port: env.db.port,
    user: env.db.username,
    password: env.db.password,
    database: 'postgres',
  });
  await client.connect();

  const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [env.db.database]);
  if (exists.rowCount) {
    console.log(`[db] база ${env.db.database} уже существует`);
  } else {
    await client.query(
      `CREATE DATABASE "${env.db.database}" TEMPLATE template0 ENCODING 'UTF8' ` +
        `LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8'`,
    );
    console.log(`[db] база ${env.db.database} создана (UTF8, en_US.UTF-8)`);
  }
  await client.end();
};

main().catch((error) => {
  console.error('[db] не удалось создать базу:', error.message);
  process.exit(1);
});
