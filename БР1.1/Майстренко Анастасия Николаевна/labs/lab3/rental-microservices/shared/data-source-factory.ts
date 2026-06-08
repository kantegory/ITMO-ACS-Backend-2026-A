import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * Фабрика источника данных. Для каждого сервиса создаётся ОТДЕЛЬНАЯ БД
 * (принцип database-per-service):
 *  - sqlite: отдельный файл dbs/<service>.sqlite
 *  - postgres: отдельная база rental_<service> на общем сервере
 */
export function createDataSource(service: string, entities: any[]): DataSource {
    const type = process.env.DB_TYPE || 'sqlite';

    let options: DataSourceOptions;
    if (type === 'postgres') {
        options = {
            type: 'postgres',
            host: process.env.PG_HOST || 'localhost',
            port: parseInt(process.env.PG_PORT || '15432'),
            username: process.env.PG_USER || 'maindb',
            password: process.env.PG_PASSWORD || 'maindb',
            database: `rental_${service}`,
            entities,
            synchronize: true,
            logging: false,
        };
    } else {
        options = {
            type: 'better-sqlite3',
            database: `dbs/${service}.sqlite`,
            entities,
            synchronize: true,
            logging: false,
        } as DataSourceOptions;
    }

    return new DataSource(options);
}
