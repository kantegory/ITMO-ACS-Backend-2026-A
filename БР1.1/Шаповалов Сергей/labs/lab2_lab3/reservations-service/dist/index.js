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
const amqplib_1 = __importDefault(require("amqplib"));
const pg_1 = require("pg");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3004;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5436),
    user: process.env.DB_USER || 'app',
    password: process.env.DB_PASSWORD || 'app',
    database: process.env.DB_NAME || 'reservations_db',
});
let amqpChannel = null;
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
function authMiddleware(req, res, next) {
    const h = req.headers['authorization'];
    if (!h)
        return res.status(401).json({ message: 'no auth' });
    const parts = h.split(' ');
    if (parts.length !== 2)
        return res.status(401).json({ message: 'bad auth' });
    const token = parts[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded.user;
        next();
    }
    catch (err) {
        res.status(401).json({ message: 'invalid token' });
    }
}
async function initAmqp() {
    try {
        const conn = await amqplib_1.default.connect(RABBITMQ_URL);
        const ch = await conn.createChannel();
        await ch.assertExchange('http.requests', 'fanout', { durable: false });
        await ch.assertExchange('app.events', 'topic', { durable: false });
        amqpChannel = ch;
        console.log('Reservations service connected to RabbitMQ');
    }
    catch (e) {
        console.warn('Reservations service AMQP connect failed, retrying in 2s', e);
        setTimeout(initAmqp, 2000);
    }
}
async function publishReservationCreated(resv) {
    try {
        const conn = await amqplib_1.default.connect(RABBITMQ_URL);
        const ch = await conn.createChannel();
        const exchange = 'app.events';
        await ch.assertExchange(exchange, 'topic', { durable: false });
        const msg = JSON.stringify({ event: 'reservation.created', data: resv });
        ch.publish(exchange, 'reservation.created', Buffer.from(msg));
        setTimeout(() => {
            ch.close();
            conn.close();
        }, 500);
    }
    catch (err) {
        console.error('Failed publish reservation.created', err);
    }
}
app.use((req, res, next) => {
    try {
        if (amqpChannel) {
            const payload = { method: req.method, path: req.path, headers: req.headers, body: req.body, ts: new Date().toISOString() };
            amqpChannel.publish('http.requests', '', Buffer.from(JSON.stringify(payload)));
        }
    }
    catch (e) {
        console.warn('Failed publish http request', e);
    }
    next();
});
app.post('/api/reservations', authMiddleware, async (req, res) => {
    const { restaurant, start_time, guest_count } = req.body;
    if (!restaurant || !start_time || !guest_count) {
        return res.status(400).json({ message: 'missing fields' });
    }
    const reservation = await pool.query('INSERT INTO reservations (user_id, restaurant_id, start_time, guest_count) VALUES ($1, $2, $3, $4) RETURNING *', [req.user.id, restaurant, start_time, guest_count]);
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
app.get('/api/reservations/my', authMiddleware, async (req, res) => {
    const result = await pool.query('SELECT * FROM reservations WHERE user_id = $1 ORDER BY id DESC', [req.user.id]);
    res.json(result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        restaurantId: row.restaurant_id,
        startTime: row.start_time,
        guestCount: row.guest_count,
    })));
});
app.post('/internal/reservations/validate', (req, res) => {
    const { restaurant, guest_count } = req.body;
    if (!restaurant || !guest_count || guest_count <= 0) {
        return res.status(409).json({ ok: false, reason: 'invalid reservation' });
    }
    return res.status(200).json({ ok: true });
});
try {
    const yml = fs_1.default.readFileSync(path_1.default.join(__dirname, '..', 'openapi.yml'), 'utf8');
    const spec = js_yaml_1.default.load(yml);
    app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(spec));
    console.log('Reservations service Swagger available at /docs');
}
catch (e) {
    console.warn('Could not load openapi.yml for Swagger', e);
}
app.listen(PORT, async () => {
    try {
        await initDb();
        await initAmqp();
        console.log(`Reservations service running on ${PORT}`);
    }
    catch (error) {
        console.error('Reservations service startup failed', error);
    }
});
