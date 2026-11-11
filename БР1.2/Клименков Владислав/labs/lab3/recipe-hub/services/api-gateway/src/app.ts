import express from 'express';
import morgan from 'morgan';

import routes from './routes';
import { errorHandler } from './middleware/errorHandler';


export const createApp = () => {
    const app = express();

    // app.use((req, _res, next) => {
    //     console.log('Request Body:', req.body);
    //     next();
    // });

    app.use(morgan('dev'));
    app.use('/api', routes);
    app.use(errorHandler);
    return app;
}
