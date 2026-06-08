import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import swaggerUi from 'swagger-ui-express';

const app = express();
app.use(cors());

const AUTH_URL = 'http://auth-service:3001';
const RECIPE_URL = 'http://recipe-service:3002';
const INTERACTION_URL = 'http://interaction-service:3003';

app.use(createProxyMiddleware({
    pathFilter: (path) => path.includes('/like'),
    target: INTERACTION_URL,
    changeOrigin: true,
    pathRewrite: { '^/recipes': '/likes' }
}));

app.use(createProxyMiddleware({
    pathFilter: (path) => path.includes('/comments'),
    target: INTERACTION_URL,
    changeOrigin: true,
    pathRewrite: { '^/recipes': '/comments' }
}));

app.use(createProxyMiddleware({
    pathFilter: '/favorites',
    target: INTERACTION_URL,
    changeOrigin: true
}));

app.use(createProxyMiddleware({
    pathFilter: '/auth',
    target: AUTH_URL,
    changeOrigin: true
}));

app.use(createProxyMiddleware({
    pathFilter: '/recipes',
    target: RECIPE_URL,
    changeOrigin: true
}));

const swaggerOptions = {
    explorer: true,
    swaggerOptions: {
        urls: [
            { url: 'http://localhost:3001/api-docs-json', name: 'Auth Service' },
            { url: 'http://localhost:3002/api-docs-json', name: 'Recipe Service' },
            { url: 'http://localhost:3003/api-docs-json', name: 'Interaction Service' }
        ]
    }
};

app.use('/docs', swaggerUi.serve, swaggerUi.setup(undefined, swaggerOptions));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🌐 Gateway is running on port ${PORT}`);
});