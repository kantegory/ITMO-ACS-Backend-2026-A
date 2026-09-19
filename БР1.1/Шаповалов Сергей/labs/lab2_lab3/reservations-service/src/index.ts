import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import amqp from 'amqplib';
import { Pool } from 'pg';

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3004;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5436),
  user: process.env.DB_USER || 'app',
  password: process.env.DB_PASSWORD || 'app',
  database: process.env.DB_NAME || 'reservations_db',
});

let amqpChannel: amqp.Channel | null = null;

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      restaurant_id INTEGER NOT NULL,
      start_time TIMESTAMPTZ NOT NULL,
      guest_count INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

function authMiddleware(req: Request & { user?: any }, res: Response, next: NextFunction) {
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

async function initAmqp() {
  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    const ch = await conn.createChannel();
    await ch.assertExchange('http.requests', 'fanout', { durable: false });
    await ch.assertExchange('app.events', 'topic', { durable: false });
    amqpChannel = ch;
    console.log('Reservations service connected to RabbitMQ');
  } catch (e) {
    console.warn('Reservations service AMQP connect failed, retrying in 2s', e);
    setTimeout(initAmqp, 2000);
  }
}

async function publishReservationCreated(resv: any) {
  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    const ch = await conn.createChannel();
    const exchange = 'app.events';
    await ch.assertExchange(exchange, 'topic', { durable: false });
    const msg = JSON.stringify({ event: 'reservation.created', data: resv });
    ch.publish(exchange, 'reservation.created', Buffer.from(msg));
    setTimeout(() => {
      ch.close();
      conn.close();
    }, 500);
  } catch (err) {
    console.error('Failed publish reservation.created', err);
  }
}

app.use((req: Request, res: Response, next) => {
  try {
    if (amqpChannel) {
      const payload = { method: req.method, path: req.path, headers: req.headers, body: req.body, ts: new Date().toISOString() };
      amqpChannel.publish('http.requests', '', Buffer.from(JSON.stringify(payload)));
    }
  } catch (e) {
    console.warn('Failed publish http request', e);
  }
  next();
});

app.post('/api/reservations', authMiddleware, async (req: Request & { user?: any }, res: Response) => {
  const { restaurant, start_time, guest_count } = req.body as {
    restaurant?: number;
    start_time?: string;
    guest_count?: number;
  };

  if (!restaurant || !start_time || !guest_count) {
    return res.status(400).json({ message: 'missing fields' });
  }

  const reservation = await pool.query(
    'INSERT INTO reservations (user_id, restaurant_id, start_time, guest_count) VALUES ($1, $2, $3, $4) RETURNING *',
    [req.user.id, restaurant, start_time, guest_count],
  );

  const created = reservation.rows[0];
  const payload = {
    id: created.id,
    userId: created.user_id,
    restaurantId: created.restaurant_id,
    startTime: created.start_time,
    guestCount: created.guest_count,
  };

  res.json(payload);
  void publishReservationCreated(payload);
});

app.get('/api/reservations/my', authMiddleware, async (req: Request & { user?: any }, res: Response) => {
  const result = await pool.query('SELECT * FROM reservations WHERE user_id = $1 ORDER BY id DESC', [req.user.id]);
  res.json(result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    restaurantId: row.restaurant_id,
    startTime: row.start_time,
    guestCount: row.guest_count,
  })));
});

app.post('/internal/reservations/validate', (req: Request, res: Response) => {
  const { restaurant, guest_count } = req.body as { restaurant?: number; guest_count?: number };
  if (!restaurant || !guest_count || guest_count <= 0) {
    return res.status(409).json({ ok: false, reason: 'invalid reservation' });
  }
  return res.status(200).json({ ok: true });
});

try {
  const yml = fs.readFileSync(path.join(__dirname, '..', 'openapi.yml'), 'utf8');
  const spec = yaml.load(yml) as any;
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
  console.log('Reservations service Swagger available at /docs');
} catch (e) {
  console.warn('Could not load openapi.yml for Swagger', e);
}

app.listen(PORT, async () => {
  try {
    await initDb();
    await initAmqp();
    console.log(`Reservations service running on ${PORT}`);
  } catch (error) {
    console.error('Reservations service startup failed', error);
  }
});

