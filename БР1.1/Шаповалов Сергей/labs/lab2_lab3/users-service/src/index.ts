import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import amqp from 'amqplib';
import { Pool } from 'pg';

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3002;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5434),
  user: process.env.DB_USER || 'app',
  password: process.env.DB_PASSWORD || 'app',
  database: process.env.DB_NAME || 'users_db',
});

let amqpChannel: amqp.Channel | null = null;

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      email VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', ['user@example.com']);
  if ((existing.rowCount ?? 0) === 0) {
    await pool.query(
      'INSERT INTO users (first_name, last_name, email) VALUES ($1, $2, $3)',
      ['Иван', 'Петров', 'user@example.com'],
    );
    console.log('Seeded demo user in users service');
  }
}

async function initAmqp() {
  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    const ch = await conn.createChannel();
    await ch.assertExchange('http.requests', 'fanout', { durable: false });
    amqpChannel = ch;
    console.log('Users service connected to RabbitMQ');
  } catch (e) {
    console.warn('Users service AMQP connect failed, retrying in 2s', e);
    setTimeout(initAmqp, 2000);
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

app.get('/api/users/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await pool.query(
    'SELECT id, first_name, last_name, email FROM users WHERE id = $1',
    [id],
  );
  if ((result.rowCount ?? 0) === 0) return res.status(404).json({ message: 'not found' });
  const user = result.rows[0];
  res.json({ id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email });
});

app.get('/internal/users/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await pool.query(
    'SELECT id, first_name, last_name, email FROM users WHERE id = $1',
    [id],
  );
  if ((result.rowCount ?? 0) === 0) return res.status(404).json({ message: 'not found' });
  const user = result.rows[0];
  res.json({ id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email });
});

try {
  const yml = fs.readFileSync(path.join(__dirname, '..', 'openapi.yml'), 'utf8');
  const spec = yaml.load(yml) as any;
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
  console.log('Users service Swagger available at /docs');
} catch (e) {
  console.warn('Users service: openapi.yml not found', e);
}

app.listen(PORT, async () => {
  try {
    await initDb();
    await initAmqp();
    console.log(`Users service running on ${PORT}`);
  } catch (error) {
    console.error('Users service startup failed', error);
  }
});
