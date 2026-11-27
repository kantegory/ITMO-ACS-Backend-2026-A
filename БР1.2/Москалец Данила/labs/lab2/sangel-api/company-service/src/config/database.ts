import { DataSource } from 'typeorm';
import { settings } from './settings';
import { Company } from '../entities/company.entity';
import { Service } from '../entities/service.entity';
import { Category } from '../entities/category.entity';
import { Discount } from '../entities/discount.entity';
import { ServiceCategory } from '../entities/service-category.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: settings.db.host,
  port: settings.db.port,
  username: settings.db.user,
  password: settings.db.password,
  database: settings.db.name,
  synchronize: settings.isDev,
  logging: settings.isDev,
  entities: [Company, Service, ServiceCategory, Category, Discount],
});