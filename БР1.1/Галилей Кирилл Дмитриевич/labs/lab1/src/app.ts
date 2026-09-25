import 'reflect-metadata';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { SETTINGS } from './config/settings';
import { AppDataSource } from './config/data-source';
import { setupSwagger } from './swagger';

import authRouter from './controllers/auth.controller';
import restaurantRouter from './controllers/restaurant.controller';
import tableRouter from './controllers/table.controller';
import menuRouter from './controllers/menu.controller';
import reservationRouter from './controllers/reservation.controller';
import reviewRouter from './controllers/review.controller';

class Server {
  private app: Application;

  constructor() {
    this.app = express();
    this.configureMiddlewares();
    this.configureRoutes();
  }

  private configureMiddlewares(): void {
    this.app.use(cors());
    this.app.use(express.json());
    setupSwagger(this.app);
  }

  private configureRoutes(): void {
    const api = express.Router();

    api.use('/auth', authRouter);
    api.use('/restaurants', restaurantRouter);
    api.use('/restaurants/:restaurantId/tables', tableRouter);
    api.use('/restaurants/:restaurantId/menu', menuRouter);
    api.use('/restaurants/:restaurantId/reviews', reviewRouter);
    api.use('/reservations', reservationRouter);

    this.app.use('/api/v1', api);

    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  }

  public async start(): Promise<void> {
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        console.log('Database connected successfully!');
      }

      this.app.listen(SETTINGS.PORT, SETTINGS.HOST, () => {
        console.log(`Server running at http://${SETTINGS.HOST}:${SETTINGS.PORT}`);
        console.log(`Swagger documentation: http://${SETTINGS.HOST}:${SETTINGS.PORT}/docs`);
      });
    } catch (err) {
      console.error('Failed to start server:', err);
    }
  }

  public getApp(): Application {
    return this.app;
  }
}

const server = new Server();
if (process.env.NODE_ENV !== 'test') {
  server.start();
}

export default server.getApp();
