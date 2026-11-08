import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";

dotenv.config();
const app = express();

// Прокси для User Service
app.use("/api/auth", createProxyMiddleware({ 
    target: "http://localhost:3001", 
    changeOrigin: true 
}));
app.use("/api/users", createProxyMiddleware({ 
    target: "http://localhost:3001", 
    changeOrigin: true 
}));

// Прокси для Recipe Service
app.use("/api/recipes", createProxyMiddleware({ 
    target: "http://localhost:3002", 
    changeOrigin: true 
}));

// Прокси для Social Service
app.use("/api/comments", createProxyMiddleware({ 
    target: "http://localhost:3003", 
    changeOrigin: true 
}));
app.use("/api/likes", createProxyMiddleware({ 
    target: "http://localhost:3003", 
    changeOrigin: true 
}));
app.use("/api/saved", createProxyMiddleware({ 
    target: "http://localhost:3003", 
    changeOrigin: true 
}));
app.use("/api/subscriptions", createProxyMiddleware({ 
    target: "http://localhost:3003", 
    changeOrigin: true 
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(` API Gateway running on http://localhost:${PORT}`);
    console.log(`   /api/auth/* → User Service (3001)`);
    console.log(`   /api/users/* → User Service (3001)`);
    console.log(`   /api/recipes/* → Recipe Service (3002)`);
    console.log(`   /api/comments/*, /api/likes/*, /api/saved/*, /api/subscriptions/* → Social Service (3003)`);
});
