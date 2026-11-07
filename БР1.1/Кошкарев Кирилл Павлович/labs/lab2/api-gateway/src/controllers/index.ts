import { Request, Response } from 'express';
import { env } from '../config/env';
import { enrichRecipes, fetchFollowingIds } from '../services/aggregate';
import { internalGet, proxy, userRequest } from '../utils/upstream';
import { unauthorized } from '../utils/errors';

const requireUser = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user;
};

const query = (req: Request): string => {
  const index = req.originalUrl.indexOf('?');
  return index === -1 ? '' : req.originalUrl.slice(index);
};

export const gatewayController = {
  /** Витрина: список рецептов + авторы + реакции одним ответом. */
  async searchRecipes(req: Request, res: Response): Promise<void> {
    const upstream = await userRequest<{ data: any[]; meta: unknown }>(
      req, `${env.services.recipe}/api/v1/recipes${query(req)}`,
    );
    if (upstream.status !== 200) {
      res.status(upstream.status).json(upstream.body);
      return;
    }
    res.json({ data: await enrichRecipes(upstream.body.data, req.user?.id), meta: upstream.body.meta });
  },

  /** Страница рецепта: контент recipe-service + автор + реакции зрителя. */
  async recipeById(req: Request, res: Response): Promise<void> {
    const upstream = await userRequest<any>(req, `${env.services.recipe}/api/v1/recipes/${req.params.id}`);
    if (upstream.status !== 200) {
      res.status(upstream.status).json(upstream.body);
      return;
    }
    const [enriched] = await enrichRecipes([upstream.body], req.user?.id);
    res.json(enriched);
  },

  async recipesByAuthor(req: Request, res: Response): Promise<void> {
    const upstream = await userRequest<{ data: any[]; meta: unknown }>(
      req, `${env.services.recipe}/api/v1/users/${req.params.id}/recipes${query(req)}`,
    );
    if (upstream.status !== 200) {
      res.status(upstream.status).json(upstream.body);
      return;
    }
    res.json({ data: await enrichRecipes(upstream.body.data, req.user?.id), meta: upstream.body.meta });
  },

  /** Сохранённое: social-service отдаёт идентификаторы, recipe-service — карточки. */
  async favorites(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    const favorites = await internalGet<{ data: number[]; meta: unknown }>(
      `${env.services.social}/internal/social/favorites/${auth.id}${query(req)}`,
    );
    if (!favorites.data.length) {
      res.json({ data: [], meta: favorites.meta });
      return;
    }
    const cards = await internalGet<{ data: any[] }>(
      `${env.services.recipe}/internal/recipes?ids=${favorites.data.join(',')}`,
    );
    // порядок задаёт social-service (сначала недавно сохранённые)
    const byId = new Map(cards.data.map((card) => [String(card.id), card]));
    const ordered = favorites.data.map((id) => byId.get(String(id))).filter(Boolean);
    res.json({ data: await enrichRecipes(ordered, auth.id), meta: favorites.meta });
  },

  /** Лента подписок: user-service отдаёт список авторов, recipe-service — их публикации. */
  async feed(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    const following = await fetchFollowingIds(auth.id);
    if (!following.data.length) {
      res.json({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } });
      return;
    }
    const params = new URLSearchParams(query(req).replace(/^\?/, ''));
    params.set('authorIds', following.data.join(','));
    const result = await internalGet<{ data: any[]; meta: unknown }>(
      `${env.services.recipe}/internal/recipes/by-authors?${params.toString()}`,
    );
    res.json({ data: await enrichRecipes(result.data, auth.id), meta: result.meta });
  },

  /** Состояние всех сервисов — удобно для проверки развёртывания. */
  async health(_req: Request, res: Response): Promise<void> {
    const probe = async (name: string, url: string) => {
      try {
        const response = await fetch(`${url}/health`);
        const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        return [name, { ...body, status: response.ok ? 'ok' : 'error' }] as const;
      } catch (error) {
        return [name, { status: 'unreachable', error: (error as Error).message }] as const;
      }
    };
    const entries = await Promise.all([
      probe('user-service', env.services.user),
      probe('recipe-service', env.services.recipe),
      probe('social-service', env.services.social),
    ]);
    const services = Object.fromEntries(entries);
    const healthy = entries.every(([, value]) => value.status === 'ok');
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      service: 'api-gateway',
      uptime: process.uptime(),
      services,
    });
  },
};

export const proxyTo = (target: 'user' | 'recipe' | 'social') =>
  (req: Request, res: Response) => proxy(req, res, env.services[target]);
