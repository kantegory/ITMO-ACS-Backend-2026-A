import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import adminRoutes from './modules/admin/admin.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'analytics-service', 
    timestamp: new Date().toISOString() 
  });
});

// API routes
app.use('/api/v1/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);