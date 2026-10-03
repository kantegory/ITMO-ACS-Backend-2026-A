import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { DataSource, Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', unique: true }) email: string;
  @Column({ type: 'varchar', select: false }) password_hash: string;
  @Column({ type: 'varchar' }) full_name: string;
  @Column({ type: 'varchar', nullable: true }) phone: string;
  @Column({ type: 'varchar', default: 'customer' }) role: string;
}

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'auth_db',
  synchronize: true,
  entities: [User]
});

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'auth_secret_key';

app.post('/auth/register', async (req, res) => {
  const { email, password, full_name, phone, role } = req.body;
  const repo = AppDataSource.getRepository(User);
  const exists = await repo.findOne({ where: { email } });
  if (exists) return res.status(409).json({ error: 'Conflict', message: 'User exists' });

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);
  const user = repo.create({ email, password_hash, full_name, phone, role: role || 'customer' });
  await repo.save(user);

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const repo = AppDataSource.getRepository(User);
  const user = await repo.createQueryBuilder('u').addSelect('u.password_hash').where('u.email = :email', { email }).getOne();
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.status(200).json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
});

app.get('/internal/auth/verify', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    res.json(decoded);
  });
});

const PORT = 5001;
async function start() {
  while (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      console.log('[auth-service] Database connected successfully!');
      break;
    } catch (err) {
      console.warn('[auth-service] Waiting for database... retrying in 3s');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`[auth-service] running on port ${PORT}`));
}
start().catch(console.error);
