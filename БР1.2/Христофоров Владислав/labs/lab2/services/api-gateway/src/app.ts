import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authMiddleware } from './middlewares/auth.middleware';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());

const swaggerPath = path.join(process.cwd(), 'src', 'docs', 'openapi.yaml');
try {
    const swaggerDocument = YAML.load(swaggerPath);
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    console.log('✅ Swagger UI подключен по адресу: /api/docs');
} catch (error) {
    console.error(
        '❌ Ошибка загрузки openapi.yaml. Проверьте путь:',
        swaggerPath,
    );
}

app.use(authMiddleware);

const IDENTITY_URL =
    process.env.IDENTITY_SERVICE_URL || 'http://localhost:8001';
const RECIPE_URL = process.env.RECIPE_SERVICE_URL || 'http://localhost:8002';
const SOCIAL_URL = process.env.SOCIAL_SERVICE_URL || 'http://localhost:8003';
const MEDIA_URL = process.env.MEDIA_SERVICE_URL || 'http://localhost:8004';

app.use(
    createProxyMiddleware({
        target: IDENTITY_URL,
        changeOrigin: true,
        logger: console,
        router: (req) => {
            const url = req.url || '';

            // Закладки уходят в Recipe Service
            if (url.startsWith('/api/v1/users/me/saved-recipes'))
                return RECIPE_URL;

            // Лайки и комменты рецептов уходят в Social Service
            if (url.match(/^\/api\/v1\/recipes\/[^\/]+\/(comments|like)/))
                return SOCIAL_URL;

            // Подписки уходят в Social Service
            if (
                url.match(
                    /^\/api\/v1\/users\/[^\/]+\/(subscribe|subscribers|subscriptions)/,
                )
            )
                return SOCIAL_URL;

            // Recipe Service
            if (
                url.startsWith('/api/v1/recipes') ||
                url.startsWith('/api/v1/dish-types') ||
                url.startsWith('/api/v1/ingredients') ||
                url.startsWith('/api/v1/admin/recipes')
            ) {
                return RECIPE_URL;
            }

            // Social Service
            if (
                url.startsWith('/api/v1/blogs') ||
                url.startsWith('/api/v1/comments') ||
                url.startsWith('/api/v1/admin/blogs') ||
                url.startsWith('/api/v1/admin/comments')
            ) {
                return SOCIAL_URL;
            }

            // Media Service
            if (
                url.startsWith('/api/v1/upload') ||
                url.startsWith('/uploads')
            ) {
                return MEDIA_URL;
            }

            // Возврат по умолчанию
            return IDENTITY_URL;
        },
    }),
);

// Обработка 404 на уровне шлюза
app.use((req, res) => {
    res.status(404).json({ message: 'Эндпоинт не найден на API Gateway' });
});

app.listen(PORT, () => {
    console.log(`🚀 API Gateway запущен на http://localhost:${PORT}`);
    console.log(
        `📚 Документация доступна на http://localhost:${PORT}/api/docs`,
    );
});
