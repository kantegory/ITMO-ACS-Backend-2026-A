// Выбор и инициализация БД сервиса.
// DATABASE_URL задан → PostgreSQL (облачный вариант, ЛР7: stateless-поды + внешняя БД);
// иначе → файл SQLite (локальная разработка и compose-стенд ЛР3/ЛР4).
import { DataSource, DataSourceOptions } from 'typeorm';

export const isPostgres = Boolean(process.env.DATABASE_URL);

export function dbOptions(defaultSqliteFile: string, entities: DataSourceOptions['entities']): DataSourceOptions {
  if (isPostgres) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities,
      synchronize: false, // схема синхронизируется вручную под advisory-lock, см. initDatabase()
      logging: false,
      extra: { max: Number(process.env.DB_POOL_MAX || 10) },
    };
  }
  return {
    type: 'sqlite',
    database: process.env.DB_PATH || defaultSqliteFile,
    entities,
    synchronize: false,
    logging: false,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const LOCK_KEY = 727001; // произвольная константа: у каждого сервиса своя БД

/**
 * Подключение (с повторами — БД может стартовать позже сервиса), синхронизация схемы и сиды.
 * В PostgreSQL всё выполняется под pg_advisory_lock: при одновременном старте N реплик
 * (rolling update, HPA) только одна из них создаёт таблицы и наполняет БД, остальные ждут.
 */
export async function initDatabase(ds: DataSource, seed?: () => Promise<void>): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await ds.initialize();
      break;
    } catch (e) {
      if (attempt >= 30) throw e;
      console.warn(`[db] connect ${attempt}/30 failed (${(e as Error).message}), retry in 2s`);
      await sleep(2000);
    }
  }
  if (!isPostgres) {
    await ds.synchronize();
    if (seed) await seed();
    return;
  }
  const qr = ds.createQueryRunner();
  await qr.connect();
  try {
    await qr.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
    await ds.synchronize();
    if (seed) await seed();
  } finally {
    await qr.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => undefined);
    await qr.release();
  }
}
