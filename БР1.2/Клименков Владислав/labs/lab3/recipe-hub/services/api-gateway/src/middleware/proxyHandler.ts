import { createProxyMiddleware } from 'http-proxy-middleware';


export const createProxy = (target: string) => {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: (_path, req) => {
            return (req as any).originalUrl || _path;
        },
    });
};
