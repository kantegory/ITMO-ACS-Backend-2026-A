import express from 'express'
import swaggerUi from 'swagger-ui-express'

import router from './routes/index.js'
import { swaggerSpec } from './swagger.js'


export const createApp = () => {
    const app = express();

    app.use(express.json());

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customSiteTitle: "API Docs"
    }));

    app.use('/api', router);

    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'OK', 
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        })
    });
    return app;
}
