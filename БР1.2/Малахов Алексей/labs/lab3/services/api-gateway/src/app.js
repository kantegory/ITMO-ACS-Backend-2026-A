const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const APP_PORT = process.env.APP_PORT || 8000;
const APP_HOST = process.env.APP_HOST || '0.0.0.0';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3002';
const PROPERTY_SERVICE_URL = process.env.PROPERTY_SERVICE_URL || 'http://property-service:3003';
const RENTAL_SERVICE_URL = process.env.RENTAL_SERVICE_URL || 'http://rental-service:3004';
const MESSAGING_SERVICE_URL = process.env.MESSAGING_SERVICE_URL || 'http://messaging-service:3005';
const REVIEW_SERVICE_URL = process.env.REVIEW_SERVICE_URL || 'http://review-service:3006';

const app = express();
app.use(cors());

// Express strips the mount prefix from req.url — restore the original path so
// services receive the full /api/v1/... path they actually expect.
const proxy = (target) => createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (_path, req) => req.originalUrl,
});

app.use('/api/v1/auth', proxy(AUTH_SERVICE_URL));
app.use('/api/v1/profile', proxy(USER_SERVICE_URL));
app.use('/api/v1/landlords', proxy(REVIEW_SERVICE_URL));
app.use('/api/v1/properties', proxy(PROPERTY_SERVICE_URL));
app.use('/api/v1/favorites', proxy(PROPERTY_SERVICE_URL));
app.use('/api/v1/rentals', proxy(RENTAL_SERVICE_URL));
app.use('/api/v1/transactions', proxy(RENTAL_SERVICE_URL));
app.use('/api/v1/conversations', proxy(MESSAGING_SERVICE_URL));
app.use('/api/v1/reviews', proxy(REVIEW_SERVICE_URL));

app.listen(APP_PORT, APP_HOST, () => {
    console.log(`[api-gateway] running on ${APP_HOST}:${APP_PORT}`);
});
