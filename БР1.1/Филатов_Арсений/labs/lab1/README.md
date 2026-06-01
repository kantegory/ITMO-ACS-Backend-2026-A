# Lab 1 — Job Search API (Elysia + Bun)

## Документация

- **OpenAPI (автогенерация из Elysia):** после `bun run dev` откройте [http://localhost:3000/openapi](http://localhost:3000/openapi), JSON: [http://localhost:3000/openapi/json](http://localhost:3000/openapi/json)

## Запуск

```bash
bun install
bun run db:up
bun run db:migrate --name init
bun run db:seed
bun run dev
```
