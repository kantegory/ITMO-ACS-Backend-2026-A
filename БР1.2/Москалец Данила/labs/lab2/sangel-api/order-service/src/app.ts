import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import requestRoutes from './modules/request/request.routes';
import reviewRoutes from './modules/review/review.routes';
import favoriteRoutes from './modules/favorite/favorite.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'order-service', 
    timestamp: new Date().toISOString() 
  });
});

// API routes
app.use('/api/v1', requestRoutes);
app.use('/api/v1', reviewRoutes);
app.use('/api/v1', favoriteRoutes);

app.use(notFoundHandler);
app.use(errorHandler);