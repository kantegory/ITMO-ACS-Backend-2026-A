import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import amqp from 'amqplib';
import { Pool } from 'pg';

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3005;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5437),
  user: process.env.DB_USER || 'app',
  password: process.env.DB_PASSWORD || 'app',
  database: process.env.DB_NAME || 'reviews_db',
});

function authMiddleware(req: Request & { user?: any }, res: Response, next: any) {
  const h = req.headers['authorization'];
  if (!h) return res.status(401).json({ message: 'no auth' });
  const parts = (h as string).split(' ');
  if (parts.length !== 2) return res.status(401).json({ message: 'bad auth' });
  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'invalid token' });
  }
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      restaurant_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const existing = await pool.query('SELECT id FROM reviews WHERE user_id = $1 AND restaurant_id = $2', [1, 1]);
  if ((existing.rowCount ?? 0) === 0) {
    await pool.query(
      'INSERT INTO reviews (user_id, restaurant_id, rating, comment) VALUES ($1, $2, $3, $4)',
      [1, 1, 5, 'Отличная пицца и уютная атмосфера'],
    );
  }
}

async function initSubscriber() {
  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    const ch = await conn.createChannel();
    const exchange = 'app.events';
    await ch.assertExchange(exchange, 'topic', { durable: false });
    const q = await ch.assertQueue('reviews.events', { durable: false });
    await ch.bindQueue(q.queue, exchange, '#');
    ch.consume(q.queue, msg => {
      if (!msg) return;
      console.log('Reviews service received event:', msg.content.toString());
      ch.ack(msg);
    });
    console.log('Reviews service connected to RabbitMQ');
  } catch (e) {
    console.warn('Reviews service AMQP subscription failed, retrying...', e);
    setTimeout(initSubscriber, 2000);
  }
}

app.get('/api/reviews', async (_req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM reviews ORDER BY id DESC');
  res.json(result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    restaurantId: row.restaurant_id,
    rating: row.rating,
    comment: row.comment,
  })));
});

app.post('/api/reviews', authMiddleware, async (req: Request & { user?: any }, res: Response) => {
  const { restaurant, rating, comment } = req.body as { restaurant?: number; rating?: number; comment?: string };
  if (!restaurant || !rating) return res.status(400).json({ message: 'missing fields' });

  const result = await pool.query(
    'INSERT INTO reviews (user_id, restaurant_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
    [req.user.id, restaurant, rating, comment || null],
  );

  const row = result.rows[0];
  res.status(201).json({
    id: row.id,
    userId: row.user_id,
    restaurantId: row.restaurant_id,
    rating: row.rating,
    comment: row.comment,
  });
});

app.get('/api/restaurants/:id/reviews', async (req: Request, res: Response) => {
  const restaurantId = Number(req.params.id);
  const result = await pool.query('SELECT * FROM reviews WHERE restaurant_id = $1 ORDER BY id DESC', [restaurantId]);
  res.json(result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    restaurantId: row.restaurant_id,
    rating: row.rating,
    comment: row.comment,
  })));
});

try {
  const yml = fs.readFileSync(path.join(__dirname, '..', 'openapi.json'), 'utf8');
  const spec = JSON.parse(yml);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
  console.log('Reviews service Swagger available at /docs');
} catch (e) {
  console.warn('Could not load openapi.json for Swagger', e);
}

app.listen(PORT, async () => {
  try {
    await initDb();
    await initSubscriber();
    console.log(`Reviews service running on ${PORT}`);
  } catch (error) {
    console.error('Reviews service startup failed', error);
  }
});
