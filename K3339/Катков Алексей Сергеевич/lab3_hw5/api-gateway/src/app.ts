import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();

const port = parseInt(process.env.APP_PORT || '8000');
const host = process.env.APP_HOST || '0.0.0.0';

const authUrl = process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:8001';
const recipeUrl = process.env.RECIPE_SERVICE_URL || 'http://127.0.0.1:8002';
const socialUrl = process.env.SOCIAL_SERVICE_URL || 'http://127.0.0.1:8003';

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ service: 'api-gateway', status: 'ok' });
});

async function proxyRequest(req: Request, res: Response, targetBaseUrl: string) {
    const targetUrl = `${targetBaseUrl}${req.originalUrl}`;

    try {
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                authorization: String(req.headers.authorization || ''),
            },
            body: ['GET', 'HEAD'].includes(req.method)
                ? undefined
                : JSON.stringify(req.body),
        });

        const text = await response.text();

        res.status(response.status);

        if (!text) {
            res.send();
            return;
        }

        try {
            res.json(JSON.parse(text));
        } catch {
            res.send(text);
        }
    } catch (error) {
        res.status(502).json({
            message: 'Gateway proxy error',
            targetUrl,
            error: String(error),
        });
    }
}

app.use('/api/auth', (req, res) => proxyRequest(req, res, authUrl));
app.use('/api/users', (req, res) => proxyRequest(req, res, authUrl));
app.use('/api/follows', (req, res) => proxyRequest(req, res, authUrl));

app.use('/api/recipes', (req, res) => proxyRequest(req, res, recipeUrl));
app.use('/api/ingredients', (req, res) => proxyRequest(req, res, recipeUrl));
app.use('/api/dish-types', (req, res) => proxyRequest(req, res, recipeUrl));
app.use('/api/recipe-steps', (req, res) => proxyRequest(req, res, recipeUrl));

app.use('/api/comments', (req, res) => proxyRequest(req, res, socialUrl));
app.use('/api/likes', (req, res) => proxyRequest(req, res, socialUrl));
app.use('/api/saved-recipes', (req, res) => proxyRequest(req, res, socialUrl));

app.listen(port, '0.0.0.0', () => {
    console.log(`api-gateway started: http://${host}:${port}`);
});