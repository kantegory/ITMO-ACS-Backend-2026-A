import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 8004);
const root = process.cwd();
const specPath = join(root, 'internal-openapi.yaml');

const contentTypes = {
    '.yaml': 'application/yaml; charset=utf-8',
    '.yml': 'application/yaml; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
};

const swaggerHtml = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HW4 Internal API Swagger</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #ffffff; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: '/docs/openapi.yaml',
      dom_id: '#swagger-ui',
      deepLinking: true,
      persistAuthorization: true
    });
  </script>
</body>
</html>`;

const redocHtml = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HW4 Internal API ReDoc</title>
</head>
<body>
  <redoc spec-url="/docs/openapi.yaml"></redoc>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>`;

const send = (response, statusCode, body, contentType) => {
    response.writeHead(statusCode, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
    });
    response.end(body);
};

const server = createServer(async (request, response) => {
    const url = new URL(request.url || '/', `http://${host}:${port}`);

    try {
        if (url.pathname === '/' || url.pathname === '/docs') {
            send(response, 200, swaggerHtml, 'text/html; charset=utf-8');
            return;
        }

        if (url.pathname === '/docs/redoc') {
            send(response, 200, redocHtml, 'text/html; charset=utf-8');
            return;
        }

        if (url.pathname === '/docs/openapi.yaml') {
            const spec = await readFile(specPath);
            const type = contentTypes[extname(specPath)] || 'text/plain; charset=utf-8';
            send(response, 200, spec, type);
            return;
        }

        send(response, 404, 'Not found', 'text/plain; charset=utf-8');
    } catch (error) {
        console.error(error);
        send(response, 500, 'Internal server error', 'text/plain; charset=utf-8');
    }
});

server.listen(port, host, () => {
    console.log(`Swagger UI: http://${host}:${port}/docs`);
    console.log(`ReDoc:      http://${host}:${port}/docs/redoc`);
    console.log(`OpenAPI:    http://${host}:${port}/docs/openapi.yaml`);
});
