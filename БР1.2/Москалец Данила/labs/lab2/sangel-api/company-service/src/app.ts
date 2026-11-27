import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import categoryRoutes from './modules/category/category.routes';
import companyRoutes from './modules/company/company.routes';
import serviceRoutes from './modules/service/service.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'company-service', 
    timestamp: new Date().toISOString() 
  });
});

// API routes
app.use('/api/v1', categoryRoutes);
app.use('/api/v1', companyRoutes);
app.use('/api/v1', serviceRoutes);

app.use(notFoundHandler);
app.use(errorHandler);