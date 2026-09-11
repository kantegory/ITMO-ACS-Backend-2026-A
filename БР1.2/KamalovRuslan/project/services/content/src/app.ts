import express from "express";
import { z } from "zod";
import { asyncHandler, authRequired, errorHandler, health, HttpError, notFound, validate } from "@fitflow/shared";
import { dataSource } from "./data-source.js";
import { Article } from "./entity.js";

const uuid = z.string().uuid();
const slug = z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const articleBody = z.object({
  title: z.string().trim().min(2).max(160),
  slug,
  content: z.string().trim().min(1).max(100_000),
});

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "256kb" }));
  app.get("/health", (_req, res) => res.json(health("content")));

  app.get("/articles", asyncHandler(async (_req, res) => {
    res.json(await dataSource.getRepository(Article).find({ order: { createdAt: "DESC" } }));
  }));
  app.get("/articles/:slug", asyncHandler(async (req, res) => {
    const article = await dataSource.getRepository(Article).findOneBy({ slug: validate(slug, req.params.slug) });
    if (!article) throw new HttpError(404, "Article was not found", "ARTICLE_NOT_FOUND");
    res.json(article);
  }));
  app.post("/articles", authRequired, asyncHandler(async (req, res) => {
    const body = validate(articleBody, req.body);
    const repo = dataSource.getRepository(Article);
    if (await repo.existsBy({ slug: body.slug })) throw new HttpError(409, "Article slug is already used", "SLUG_TAKEN");
    res.status(201).json(await repo.save(repo.create({ ...body, authorId: req.auth!.sub })));
  }));
  app.patch("/articles/:id", authRequired, asyncHandler(async (req, res) => {
    const repo = dataSource.getRepository(Article);
    const article = await repo.findOneBy({ id: validate(uuid, req.params.id) });
    if (!article) throw new HttpError(404, "Article was not found", "ARTICLE_NOT_FOUND");
    if (article.authorId !== req.auth!.sub && req.auth!.role !== "admin") throw new HttpError(403, "Only the author can edit this article", "FORBIDDEN");
    const body = validate(articleBody.partial(), req.body);
    if (body.slug && body.slug !== article.slug && await repo.existsBy({ slug: body.slug })) throw new HttpError(409, "Article slug is already used", "SLUG_TAKEN");
    repo.merge(article, body);
    res.json(await repo.save(article));
  }));
  app.delete("/articles/:id", authRequired, asyncHandler(async (req, res) => {
    const repo = dataSource.getRepository(Article);
    const article = await repo.findOneBy({ id: validate(uuid, req.params.id) });
    if (!article) throw new HttpError(404, "Article was not found", "ARTICLE_NOT_FOUND");
    if (article.authorId !== req.auth!.sub && req.auth!.role !== "admin") throw new HttpError(403, "Only the author can delete this article", "FORBIDDEN");
    await repo.remove(article);
    res.status(204).end();
  }));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
