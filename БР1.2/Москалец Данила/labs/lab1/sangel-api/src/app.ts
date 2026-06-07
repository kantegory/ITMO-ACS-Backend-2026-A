import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { AppDataSource } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import { swaggerSpec } from './swagger';
import categoryRoutes from './modules/category/category.routes';
import companyRoutes from './modules/company/company.routes';
import serviceRoutes from './modules/service/service.routes';
import requestRoutes from './modules/request/request.routes';
import reviewRoutes from './modules/review/review.routes';
import favoriteRoutes from './modules/favorite/favorite.routes';
import adminRoutes from './modules/admin/admin.routes';

export class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests from this IP',
    });
    this.app.use(limiter);
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      });
    });

    // Swagger UI
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Sangel API Documentation',
    }));
    
    // Swagger JSON
    this.app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    // API routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/users', userRoutes);
    this.app.use('/api/v1/categories', categoryRoutes);
    this.app.use('/api/v1/companies', companyRoutes);
    this.app.use('/api/v1', serviceRoutes);
    this.app.use('/api/v1', requestRoutes);
    this.app.use('/api/v1', reviewRoutes);
    this.app.use('/api/v1', favoriteRoutes);
    this.app.use('/api/v1/admin', adminRoutes);
  }

  private setupErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async initialize(): Promise<void> {
    try {
      await AppDataSource.initialize();
      console.log('Database connected successfully');
      console.log('Database synchronization enabled');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }

    this.setupRoutes();
    this.setupErrorHandling();
  }

  public getApp(): express.Application {
    return this.app;
  }
}