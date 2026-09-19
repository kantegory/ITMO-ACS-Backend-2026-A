import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/data-source';
import { settings } from './config/settings';
import { Review } from './models/review.entity';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get(`${settings.apiPrefix}/reviews`, async (_req, res) => {
  try {
    const reviews = await AppDataSource.getRepository(Review).find();
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

AppDataSource.initialize()
  .then(() => {
    app.listen(settings.port, settings.host, () => {
      console.log(`Review service listening on ${settings.host}:${settings.port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
