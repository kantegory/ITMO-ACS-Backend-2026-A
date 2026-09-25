import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { DataSource, Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, BaseEntity } from 'typeorm';

@Entity('restaurants')
export class Restaurant extends BaseEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar' }) name: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'varchar' }) cuisine_type: string;
  @Column({ type: 'int', default: 2 }) price_range: number;
  @Column({ type: 'varchar' }) address: string;
  @Column({ type: 'varchar' }) city: string;
  @Column({ type: 'varchar' }) phone: string;
  @Column({ type: 'numeric', default: 0 }) rating: number;
  @OneToMany(() => RestaurantTable, t => t.restaurant) tables: RestaurantTable[];
}

@Entity('restaurant_tables')
export class RestaurantTable extends BaseEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar' }) restaurant_id: string;
  @Column({ type: 'int' }) table_number: number;
  @Column({ type: 'int' }) capacity: number;
  @Column({ type: 'varchar', default: 'main_hall' }) location_zone: string;
  @Column({ type: 'boolean', default: true }) is_active: boolean;
  @ManyToOne(() => Restaurant, r => r.tables) @JoinColumn({ name: 'restaurant_id' }) restaurant: Restaurant;
}

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'restaurant_db',
  synchronize: true,
  entities: [Restaurant, RestaurantTable]
});

const app = express();
app.use(cors());
app.use(express.json());

app.get('/restaurants', async (req, res) => {
  const { cuisine, city } = req.query;
  const repo = AppDataSource.getRepository(Restaurant);
  const q = repo.createQueryBuilder('r').leftJoinAndSelect('r.tables', 'tables');
  if (cuisine) q.andWhere('r.cuisine_type ILIKE :cuisine', { cuisine: `%${cuisine}%` });
  if (city) q.andWhere('r.city ILIKE :city', { city: `%${city}%` });
  const items = await q.getMany();
  res.json({ total: items.length, items });
});

app.get('/internal/restaurants/:restaurantId/tables/:tableId/verify', async (req, res) => {
  const { restaurantId, tableId } = req.params;
  const table = await AppDataSource.getRepository(RestaurantTable).findOne({
    where: { id: tableId, restaurant_id: restaurantId, is_active: true }
  });
  if (!table) return res.status(404).json({ error: 'NotFound', message: 'Table not active or not found' });
  res.json({ id: table.id, capacity: table.capacity, isActive: table.is_active });
});

const PORT = 5002;
async function start() {
  while (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      console.log('[restaurant-service] Database connected successfully!');
      break;
    } catch (err) {
      console.warn('[restaurant-service] Waiting for database... retrying in 3s');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`[restaurant-service] running on port ${PORT}`));
}
start().catch(console.error);
