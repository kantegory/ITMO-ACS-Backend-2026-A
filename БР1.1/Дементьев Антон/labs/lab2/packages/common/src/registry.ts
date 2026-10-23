import { DataSource } from 'typeorm';

// Данные текущего сервиса (заполняются в startService)
export const ctx: { name: string; dataSource?: DataSource } = { name: 'service' };
