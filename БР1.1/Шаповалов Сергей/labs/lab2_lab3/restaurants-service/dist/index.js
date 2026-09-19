"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const path_1 = __importDefault(require("path"));
const amqplib_1 = __importDefault(require("amqplib"));
const pg_1 = require("pg");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3003;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5435),
    user: process.env.DB_USER || 'app',
    password: process.env.DB_PASSWORD || 'app',
    database: process.env.DB_NAME || 'restaurants_db',
});
let amqpChannel = null;
async function initDb() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS cuisine_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL
    )
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      address VARCHAR(255),
      district VARCHAR(255),
      price_range INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS restaurant_cuisines (
      id SERIAL PRIMARY KEY,
      restaurant_id INTEGER NOT NULL,
      cuisine_type_id INTEGER NOT NULL
    )
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id SERIAL PRIMARY KEY,
      restaurant_id INTEGER NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC(10,2) NOT NULL
    )
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS restaurant_photos (
      id SERIAL PRIMARY KEY,
      restaurant_id INTEGER NOT NULL,
      photo_url VARCHAR(512) NOT NULL
    )
  `);
    const cuisines = ['Итальянская', 'Японская', 'Русская', 'Грузинская'];
    for (const cuisineName of cuisines) {
        const existing = await pool.query('SELECT id FROM cuisine_types WHERE name = $1', [cuisineName]);
        if ((existing.rowCount ?? 0) === 0) {
            await pool.query('INSERT INTO cuisine_types (name) VALUES ($1)', [cuisineName]);
        }
    }
    const restaurantSeed = [
        {
            name: 'La Bella Italia',
            description: 'Уютный итальянский ресторан в центре города',
            address: 'Невский проспект, 10',
            district: 'Центральный',
            priceRange: 3,
            cuisine: 'Итальянская',
            menu: [
                { name: 'Маргарита', description: 'Классическая пицца', price: 650 },
                { name: 'Карбонара', description: 'Паста с беконом', price: 720 },
            ],
            photoUrl: 'https://example.com/italia.jpg',
        },
        {
            name: 'Sakura Sushi',
            description: 'Аутентичная японская кухня',
            address: 'Лиговский пр., 50',
            district: 'Адмиралтейский',
            priceRange: 4,
            cuisine: 'Японская',
            menu: [
                { name: 'Филадельфия', description: 'Ролл с лососем', price: 480 },
                { name: 'Мисо-суп', description: 'Традиционный суп', price: 320 },
            ],
            photoUrl: 'https://example.com/sakura.jpg',
        },
        {
            name: 'Теремок',
            description: 'Русская домашняя кухня',
            address: 'Московский пр., 100',
            district: 'Московский',
            priceRange: 2,
            cuisine: 'Русская',
            menu: [
                { name: 'Блины с икрой', description: 'Тонкие блины', price: 890 },
                { name: 'Борщ', description: 'С говядиной и сметаной', price: 350 },
            ],
            photoUrl: 'https://example.com/teremok.jpg',
        },
    ];
    for (const data of restaurantSeed) {
        const restaurantExists = await pool.query('SELECT id FROM restaurants WHERE name = $1', [data.name]);
        if ((restaurantExists.rowCount ?? 0) === 0) {
            const restaurant = await pool.query('INSERT INTO restaurants (name, description, address, district, price_range) VALUES ($1, $2, $3, $4, $5) RETURNING id', [data.name, data.description, data.address, data.district, data.priceRange]);
            const restaurantId = restaurant.rows[0].id;
            const cuisineResult = await pool.query('SELECT id FROM cuisine_types WHERE name = $1', [data.cuisine]);
            if ((cuisineResult.rowCount ?? 0) > 0) {
                await pool.query('INSERT INTO restaurant_cuisines (restaurant_id, cuisine_type_id) VALUES ($1, $2)', [restaurantId, cuisineResult.rows[0].id]);
            }
            for (const item of data.menu) {
                await pool.query('INSERT INTO menu_items (restaurant_id, name, description, price) VALUES ($1, $2, $3, $4)', [restaurantId, item.name, item.description, item.price]);
            }
            await pool.query('INSERT INTO restaurant_photos (restaurant_id, photo_url) VALUES ($1, $2)', [restaurantId, data.photoUrl]);
        }
    }
}
async function initAmqp() {
    try {
        const conn = await amqplib_1.default.connect(RABBITMQ_URL);
        const ch = await conn.createChannel();
        await ch.assertExchange('http.requests', 'fanout', { durable: false });
        amqpChannel = ch;
        console.log('Restaurants service connected to RabbitMQ');
    }
    catch (e) {
        console.warn('Restaurants service AMQP connect failed, retrying in 2s', e);
        setTimeout(initAmqp, 2000);
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
app.get('/api/restaurants', async (_req, res) => {
    const restaurants = await pool.query('SELECT * FROM restaurants ORDER BY id');
    const enriched = [];
    for (const restaurant of restaurants.rows) {
        const menu = await pool.query('SELECT id, name, description, price FROM menu_items WHERE restaurant_id = $1 ORDER BY id', [restaurant.id]);
        const photos = await pool.query('SELECT photo_url FROM restaurant_photos WHERE restaurant_id = $1 ORDER BY id', [restaurant.id]);
        const cuisine = await pool.query(`SELECT ct.name FROM cuisine_types ct
       JOIN restaurant_cuisines rc ON rc.cuisine_type_id = ct.id
       WHERE rc.restaurant_id = $1`, [restaurant.id]);
        enriched.push({
            id: restaurant.id,
            name: restaurant.name,
            description: restaurant.description,
            address: restaurant.address,
            district: restaurant.district,
            priceRange: restaurant.price_range,
            cuisine: cuisine.rows[0]?.name || null,
            menu: menu.rows,
            photos: photos.rows,
        });
    }
    res.json(enriched);
});
app.get('/api/restaurants/:id', async (req, res) => {
    const id = Number(req.params.id);
    const result = await pool.query('SELECT * FROM restaurants WHERE id = $1', [id]);
    if ((result.rowCount ?? 0) === 0)
        return res.status(404).json({ message: 'not found' });
    const restaurant = result.rows[0];
    const menu = await pool.query('SELECT id, name, description, price FROM menu_items WHERE restaurant_id = $1 ORDER BY id', [id]);
    const photos = await pool.query('SELECT photo_url FROM restaurant_photos WHERE restaurant_id = $1 ORDER BY id', [id]);
    const cuisine = await pool.query(`SELECT ct.name FROM cuisine_types ct
     JOIN restaurant_cuisines rc ON rc.cuisine_type_id = ct.id
     WHERE rc.restaurant_id = $1`, [id]);
    res.json({
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description,
        address: restaurant.address,
        district: restaurant.district,
        priceRange: restaurant.price_range,
        cuisine: cuisine.rows[0]?.name || null,
        menu: menu.rows,
        photos: photos.rows,
    });
});
app.get('/internal/restaurants/:id', async (req, res) => {
    const id = Number(req.params.id);
    const result = await pool.query('SELECT id, name, address, price_range FROM restaurants WHERE id = $1', [id]);
    if ((result.rowCount ?? 0) === 0)
        return res.status(404).json({ message: 'not found' });
    const restaurant = result.rows[0];
    res.json({ id: restaurant.id, name: restaurant.name, address: restaurant.address, priceRange: restaurant.price_range });
});
app.get('/api/restaurants/:id/reviews', (_req, res) => {
    res.json([]);
});
try {
    const yml = fs_1.default.readFileSync(path_1.default.join(__dirname, '..', 'openapi.yml'), 'utf8');
    const spec = js_yaml_1.default.load(yml);
    app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(spec));
    console.log('Restaurants service Swagger available at /docs');
}
catch (e) {
    console.warn('Restaurants service: openapi.yml not found', e);
}
app.listen(PORT, async () => {
    try {
        await initDb();
        await initAmqp();
        console.log(`Restaurants service running on ${PORT}`);
    }
    catch (error) {
        console.error('Restaurants service startup failed', error);
    }
});
