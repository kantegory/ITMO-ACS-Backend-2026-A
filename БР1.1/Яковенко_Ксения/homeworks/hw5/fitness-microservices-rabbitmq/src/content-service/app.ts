import 'reflect-metadata';
import { In } from 'typeorm';
import { envInt } from '../shared/env';
import { createServiceApp, finishServiceApp } from '../shared/app';
import {
  AuthenticatedRequest,
  currentUser,
  requireGatewayUser,
  requireRole,
} from '../shared/auth-context';
import {
  asyncHandler,
  HttpError,
  pagination,
  parsePositiveInt,
  requireString,
} from '../shared/http';
import { startService } from '../shared/start';
import { contentDataSource } from './data-source';
import { BlogCategory } from './entities/blog-category.entity';
import { BlogPost, BlogPostStatus } from './entities/blog-post.entity';

const app = createServiceApp('content-service');
const port = envInt('CONTENT_PORT', 3005);

function ids(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map(Number).filter((id) => Number.isInteger(id) && id > 0);
}

function validStatus(value: unknown): BlogPostStatus {
  if (value !== 'draft' && value !== 'published') {
    throw new HttpError(422, 'status must be draft or published', 'VALIDATION_ERROR');
  }
  return value;
}

app.get(
  '/api/blog/categories',
  asyncHandler(async (_req, res) => {
    const items = await contentDataSource
      .getRepository(BlogCategory)
      .find({ order: { id: 'ASC' } });
    res.json({ items });
  }),
);

app.post(
  '/api/blog/categories',
  requireGatewayUser,
  requireRole('trainer', 'admin'),
  asyncHandler(async (req, res) => {
    const repository = contentDataSource.getRepository(BlogCategory);
    const name = requireString(req.body.name, 'name');
    const slug = requireString(req.body.slug, 'slug');
    if (await repository.findOne({ where: [{ name }, { slug }] })) {
      throw new HttpError(409, 'Category with this name or slug already exists', 'CATEGORY_EXISTS');
    }
    const category = await repository.save(
      repository.create({ name, slug, description: req.body.description }),
    );
    res.status(201).json({ category });
  }),
);

app.get(
  '/api/blog/posts',
  asyncHandler(async (req, res) => {
    const repository = contentDataSource.getRepository(BlogPost);
    const qb = repository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.categories', 'categories')
      .distinct(true);
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      qb.andWhere(
        `(LOWER(post.title) LIKE LOWER(:q)
          OR LOWER(COALESCE(post.summary, '')) LIKE LOWER(:q)
          OR LOWER(post.content) LIKE LOWER(:q))`,
        { q: `%${req.query.q.trim()}%` },
      );
    }
    qb.andWhere('post.status = :status', { status: req.query.status ?? 'published' });
    if (typeof req.query.categoryIds === 'string') {
      const categoryIds = req.query.categoryIds
        .split(',')
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0);
      if (categoryIds.length) qb.andWhere('categories.id IN (:...categoryIds)', { categoryIds });
    }
    qb.orderBy('post.createdAt', 'DESC');
    const { page, pageSize, skip } = pagination(req.query);
    qb.skip(skip).take(pageSize);
    const [items, totalItems] = await qb.getManyAndCount();
    res.json({
      items,
      pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
    });
  }),
);

app.get(
  '/api/blog/posts/:id',
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, 'id');
    const blogPost = await contentDataSource.getRepository(BlogPost).findOne({
      where: { id },
      relations: ['categories'],
    });
    if (!blogPost) throw new HttpError(404, 'Blog post not found', 'BLOG_POST_NOT_FOUND');
    res.json({ blogPost });
  }),
);

app.post(
  '/api/blog/posts',
  requireGatewayUser,
  requireRole('trainer', 'admin'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = currentUser(req);
    const repository = contentDataSource.getRepository(BlogPost);
    const slug = requireString(req.body.slug, 'slug');
    if (await repository.findOneBy({ slug })) {
      throw new HttpError(409, 'Post with this slug already exists', 'SLUG_EXISTS');
    }
    const categoryIds = ids(req.body.categoryIds);
    if (!categoryIds.length) {
      throw new HttpError(422, 'categoryIds must contain at least one id', 'VALIDATION_ERROR');
    }
    const categories = await contentDataSource
      .getRepository(BlogCategory)
      .findBy({ id: In(categoryIds) });
    if (categories.length !== new Set(categoryIds).size) {
      throw new HttpError(400, 'One or more categories were not found', 'CATEGORY_NOT_FOUND');
    }
    const status = validStatus(req.body.status);
    const blogPost = await repository.save(
      repository.create({
        title: requireString(req.body.title, 'title'),
        slug,
        summary: req.body.summary,
        content: requireString(req.body.content, 'content'),
        coverImageUrl: req.body.coverImageUrl,
        status,
        publishedAt:
          req.body.publishedAt !== undefined
            ? new Date(req.body.publishedAt)
            : status === 'published'
              ? new Date()
              : undefined,
        authorId: user.id,
        categories,
      }),
    );
    res.status(201).json({ blogPost });
  }),
);

app.patch(
  '/api/blog/posts/:id',
  requireGatewayUser,
  requireRole('trainer', 'admin'),
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, 'id');
    const repository = contentDataSource.getRepository(BlogPost);
    const item = await repository.findOne({ where: { id }, relations: ['categories'] });
    if (!item) throw new HttpError(404, 'Blog post not found', 'BLOG_POST_NOT_FOUND');

    if (req.body.slug !== undefined && req.body.slug !== item.slug) {
      const slug = requireString(req.body.slug, 'slug');
      if (await repository.findOneBy({ slug })) {
        throw new HttpError(409, 'Post with this slug already exists', 'SLUG_EXISTS');
      }
      item.slug = slug;
    }
    if (req.body.categoryIds !== undefined) {
      const categoryIds = ids(req.body.categoryIds);
      const categories = await contentDataSource
        .getRepository(BlogCategory)
        .findBy({ id: In(categoryIds) });
      if (categories.length !== new Set(categoryIds).size) {
        throw new HttpError(400, 'One or more categories were not found', 'CATEGORY_NOT_FOUND');
      }
      item.categories = categories;
    }
    if (req.body.title !== undefined) item.title = requireString(req.body.title, 'title');
    if (req.body.summary !== undefined) item.summary = req.body.summary;
    if (req.body.content !== undefined) item.content = requireString(req.body.content, 'content');
    if (req.body.coverImageUrl !== undefined) item.coverImageUrl = req.body.coverImageUrl;
    if (req.body.status !== undefined) item.status = validStatus(req.body.status);
    if (req.body.publishedAt !== undefined) item.publishedAt = new Date(req.body.publishedAt);
    await repository.save(item);
    res.json({ blogPost: item });
  }),
);

app.delete(
  '/api/blog/posts/:id',
  requireGatewayUser,
  requireRole('trainer', 'admin'),
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, 'id');
    const repository = contentDataSource.getRepository(BlogPost);
    const item = await repository.findOneBy({ id });
    if (!item) throw new HttpError(404, 'Blog post not found', 'BLOG_POST_NOT_FOUND');
    await repository.remove(item);
    res.json({ success: true });
  }),
);

finishServiceApp(app);

void startService(app, contentDataSource, port, 'content-service').catch((error) => {
  console.error(error);
  process.exit(1);
});
