"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PUBLIC_FILES = new Set([
  "index.html", "restaurant.html", "tables.html", "booking.html",
  "login.html", "register.html", "profile.html", "bookings.html",
]);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".jpg": "image/jpeg",
  ".png": "image/png", ".svg": "image/svg+xml", ".ttf": "font/ttf",
};

function fail(res, status, message) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ message }));
}

function createServer({
  authApi = process.env.AUTH_API || "http://127.0.0.1:8081",
  catalogApi = process.env.CATALOG_API || "http://127.0.0.1:8082",
  bookingApi = process.env.BOOKING_API || "http://127.0.0.1:8083",
} = {}) {
  return http.createServer((req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      return fail(res, 400, "Некорректный адрес.");
    }
    if (pathname.startsWith("/api/")) {
      let target;
      if (pathname.startsWith("/api/auth/")) target = authApi;
      else if (/^\/api\/restaurants\/[^/]+\/tables\/[^/]+\/availability$/.test(pathname)) target = bookingApi;
      else if (pathname.startsWith("/api/restaurants/")) target = catalogApi;
      else if (pathname === "/api/bookings" || pathname.startsWith("/api/me/bookings")) target = bookingApi;
      if (!target) return fail(res, 404, "Маршрут не найден.");

      const destination = new URL(target);
      const upstream = http.request({
        hostname: destination.hostname,
        port: destination.port || 80,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: destination.host },
      }, (response) => {
        res.writeHead(response.statusCode, response.headers);
        response.pipe(res);
        response.on("error", () => res.destroy());
      });
      upstream.setTimeout(15000, () => upstream.destroy());
      upstream.on("error", () => {
        if (!res.headersSent) fail(res, 502, "Не удалось подключиться к Go API.");
        else res.destroy();
      });
      req.on("aborted", () => upstream.destroy());
      req.pipe(upstream);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") return fail(res, 405, "Метод не поддерживается.");
    const file = pathname === "/" ? "index.html" : pathname.slice(1);
    const asset = /^(css|js|images|fonts|vendor)\/[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*\.(jpg|png|svg|ttf|css|js)$/.test(file);
    if (!PUBLIC_FILES.has(file) && !asset) return fail(res, 404, "Файл не найден.");
    fs.readFile(path.join(__dirname, "public", file), (error, data) => {
      if (error) return fail(res, 404, "Файл не найден.");
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] });
      res.end(req.method === "HEAD" ? undefined : data);
    });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8766);
  createServer().listen(port, "127.0.0.1", () => console.log(`BaT: http://127.0.0.1:${port}`));
}

module.exports = { createServer };
