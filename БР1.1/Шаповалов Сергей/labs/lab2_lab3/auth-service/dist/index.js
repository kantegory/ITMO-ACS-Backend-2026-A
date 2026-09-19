"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const path_1 = __importDefault(require("path"));
const pg_1 = require("pg");
const amqplib_1 = __importDefault(require("amqplib"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5433),
    user: process.env.DB_USER || 'app',
    password: process.env.DB_PASSWORD || 'app',
    database: process.env.DB_NAME || 'auth_db',
};
const pool = new pg_1.Pool(DB_CONFIG);
let amqpChannel = null;
async function initDb() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', ['user@example.com']);
    if ((existing.rowCount ?? 0) === 0) {
        await pool.query('INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4)', ['Иван', 'Петров', 'user@example.com', 'password123']);
        console.log('Seeded demo user: user@example.com / password123');
    }
}
async function initAmqp() {
    try {
        const conn = await amqplib_1.default.connect(RABBITMQ_URL);
        const ch = await conn.createChannel();
        await ch.assertExchange('http.requests', 'fanout', { durable: false });
        await ch.assertExchange('app.events', 'topic', { durable: false });
        amqpChannel = ch;
        console.log('Auth service connected to RabbitMQ');
    }
    catch (e) {
        console.warn('Auth service AMQP connect failed, retrying in 2s', e);
        setTimeout(initAmqp, 2000);
    }
}
async function publishUserRegistered(user) {
    try {
        const conn = await amqplib_1.default.connect(RABBITMQ_URL);
        const ch = await conn.createChannel();
        const exchange = 'app.events';
        await ch.assertExchange(exchange, 'topic', { durable: false });
        const msg = JSON.stringify({ event: 'user.registered', data: { id: user.id, email: user.email } });
        ch.publish(exchange, 'user.registered', Buffer.from(msg));
        setTimeout(() => {
            ch.close();
            conn.close();
        }, 500);
    }
    catch (err) {
        console.error('Failed publish user.registered', err);
    }
}
app.use((req, res, next) => {
    try {
        if (amqpChannel) {
            const payload = {
                method: req.method,
                path: req.path,
                headers: req.headers,
                body: req.body,
                ts: new Date().toISOString(),
            };
            amqpChannel.publish('http.requests', '', Buffer.from(JSON.stringify(payload)));
        }
    }
    catch (e) {
        console.warn('Failed publish http request', e);
    }
    next();
});
app.post('/auth/register', async (req, res) => {
    const { first_name, last_name, email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'email and password required' });
    }
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if ((existing.rowCount ?? 0) > 0) {
        return res.status(400).json({ message: 'User exists' });
    }
    const inserted = await pool.query('INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id, first_name, last_name, email', [first_name || null, last_name || null, email, password]);
    const user = inserted.rows[0];
    res.status(201).json({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
    });
    void publishUserRegistered({ id: user.id, email: user.email });
});
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'email and password required' });
    }
    const userResult = await pool.query('SELECT id, email FROM users WHERE email = $1 AND password = $2', [email, password]);
    if ((userResult.rowCount ?? 0) === 0) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }
    const user = userResult.rows[0];
    const token = jsonwebtoken_1.default.sign({ user: { id: user.id } }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ accessToken: token });
});
app.post('/auth/verify', (req, res) => {
    const { token } = req.body;
    if (!token)
        return res.status(400).json({ message: 'token required' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        res.json({ userId: decoded.user.id, exp: decoded.exp });
    }
    catch (err) {
        res.status(401).json({ message: 'invalid token' });
    }
});
app.listen(PORT, async () => {
    try {
        await initDb();
        await initAmqp();
        console.log(`Auth service running on ${PORT}`);
    }
    catch (error) {
        console.error('Auth service startup failed', error);
    }
});
try {
    const yml = fs_1.default.readFileSync(path_1.default.join(__dirname, '..', 'openapi.yml'), 'utf8');
    const spec = js_yaml_1.default.load(yml);
    app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(spec));
    console.log('Auth service Swagger available at /docs');
}
catch (e) {
    console.warn('Could not load openapi.yml for Swagger', e);
}
