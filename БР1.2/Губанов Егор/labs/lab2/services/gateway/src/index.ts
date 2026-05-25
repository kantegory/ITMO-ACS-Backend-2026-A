import dotenv from "dotenv";
import path from "path";
import express from "express";
import cors from "cors";
import {
  createProxyMiddleware,
  fixRequestBody,
} from "http-proxy-middleware";
import { requireAuth } from "../../../packages/shared/src/authMiddleware";
import { wrap } from "../../../packages/shared/src/wrap";
import { errorHandler } from "../../../packages/shared/src/errorHandler";
import * as orch from "./orchestration";

dotenv.config({ path: path.join(__dirname, "../../../.env") });

const AUTH_URL = process.env.AUTH_URL || "http://localhost:3001";
const CATALOG_URL = process.env.CATALOG_URL || "http://localhost:3002";
const DEALS_URL = process.env.DEALS_URL || "http://localhost:3003";
const MESSAGING_URL = process.env.MESSAGING_URL || "http://localhost:3004";

const app = express();
app.use(cors());
app.use(express.json());

app.get(["/", "/api", "/api/v1", "/api/v1/"], (_req, res) => {
  res.json({
    service: "rent-gateway",
    api_base: "/api/v1",
    try: "/api/v1/property-types/",
  });
});

const proxyOpts = {
  changeOrigin: true as const,
  on: { proxyReq: fixRequestBody },
  pathRewrite: (_path: string, req: express.Request) => req.originalUrl,
};

app.get(
  ["/api/v1/history", "/api/v1/history/"],
  requireAuth,
  wrap(orch.history)
);
app.get(
  ["/api/v1/me/owning", "/api/v1/me/owning/"],
  requireAuth,
  wrap(orch.owning)
);

app.use(
  "/api/v1/me/renting",
  requireAuth,
  createProxyMiddleware({ target: DEALS_URL, ...proxyOpts })
);
app.use(
  "/api/v1/me/owning/deals",
  requireAuth,
  createProxyMiddleware({ target: DEALS_URL, ...proxyOpts })
);

app.use(
  "/api/v1/me",
  requireAuth,
  createProxyMiddleware({ target: AUTH_URL, ...proxyOpts })
);

app.use(
  "/api/v1/auth",
  createProxyMiddleware({ target: AUTH_URL, ...proxyOpts })
);
app.use(
  "/api/v1/property-types",
  createProxyMiddleware({ target: CATALOG_URL, ...proxyOpts })
);
app.use(
  "/api/v1/properties",
  createProxyMiddleware({ target: CATALOG_URL, ...proxyOpts })
);
app.use(
  "/api/v1/photos",
  createProxyMiddleware({ target: CATALOG_URL, ...proxyOpts })
);
app.use(
  "/api/v1/conditions",
  createProxyMiddleware({ target: CATALOG_URL, ...proxyOpts })
);
app.use(
  "/api/v1/deals",
  createProxyMiddleware({ target: DEALS_URL, ...proxyOpts })
);
app.use(
  "/api/v1/messages",
  createProxyMiddleware({ target: MESSAGING_URL, ...proxyOpts })
);

app.use(errorHandler);

const port = parseInt(process.env.GATEWAY_PORT || "3000", 10);
app.listen(port, () => {
  console.log("gateway http://localhost:" + port + "/api/v1");
});
