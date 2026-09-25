import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import amqp from 'amqplib';
import { DataSource, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity } from 'typeorm';

@Entity('reservations')
export class Reservation extends BaseEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar' }) user_id: string;
  @Column({ type: 'varchar' }) restaurant_id: string;
  @Column({ type: 'varchar' }) table_id: string;
  @Column({ type: 'date' }) reservation_date: string;
  @Column({ type: 'time' }) start_time: string;
  @Column({ type: 'time' }) end_time: string;
  @Column({ type: 'int', default: 2 }) guests_count: number;
  @Column({ type: 'varchar', default: 'confirmed' }) status: string;
  @Column({ type: 'text', nullable: true }) special_requests: string;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
}

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'booking_db',
  synchronize: true,
  entities: [Reservation]
});

let amqpChannel: amqp.Channel | null = null;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE = 'restaurant_events';

async function connectRabbitMQ() {
  while (!amqpChannel) {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      amqpChannel = await conn.createChannel();
      await amqpChannel.assertExchange(EXCHANGE, 'topic', { durable: true });
      console.log('[booking-service] Connected to RabbitMQ');
      break;
    } catch (err) {
      console.warn('[booking-service] RabbitMQ not ready yet, retrying in 3 seconds...');
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

const app = express();
app.use(cors());
app.use(express.json());

app.post('/reservations', async (req, res) => {
  const { user_id, restaurant_id, table_id, reservation_date, start_time, end_time, guests_count, special_requests } = req.body;
  const repo = AppDataSource.getRepository(Reservation);

  // Overbooking check:
  const conflict = await repo.createQueryBuilder('r')
    .where('r.table_id = :table_id', { table_id })
    .andWhere('r.reservation_date = :reservation_date', { reservation_date })
    .andWhere('r.status != :cancelled', { cancelled: 'cancelled' })
    .andWhere('NOT (r.end_time <= :start_time OR r.start_time >= :end_time)', { start_time, end_time })
    .getOne();

  if (conflict) {
    return res.status(409).json({ error: 'Conflict', message: 'Table already reserved for this interval' });
  }

  const reservation = repo.create({
    user_id: user_id || 'sample-user-id',
    restaurant_id,
    table_id,
    reservation_date,
    start_time,
    end_time,
    guests_count: guests_count || 2,
    special_requests,
    status: 'confirmed'
  });
  await repo.save(reservation);

  // Publish event to RabbitMQ
  if (amqpChannel) {
    const eventPayload = Buffer.from(JSON.stringify(reservation));
    amqpChannel.publish(EXCHANGE, 'reservation.created', eventPayload);
    console.log('[booking-service] Published reservation.created event to RabbitMQ');
  }

  res.status(201).json(reservation);
});

app.get('/reservations/my', async (req, res) => {
  const repo = AppDataSource.getRepository(Reservation);
  const items = await repo.find({ order: { created_at: 'DESC' } });
  res.json(items);
});

const PORT = 5003;
async function start() {
  while (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      console.log('[booking-service] Database connected successfully!');
      break;
    } catch (err) {
      console.warn('[booking-service] Waiting for database... retrying in 3s');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  connectRabbitMQ();
  app.listen(PORT, '0.0.0.0', () => console.log(`[booking-service] running on port ${PORT}`));
}
start().catch(console.error);
