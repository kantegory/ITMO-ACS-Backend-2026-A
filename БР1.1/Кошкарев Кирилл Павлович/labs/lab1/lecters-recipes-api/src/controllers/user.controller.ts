import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { recipeService } from '../services/recipe.service';
import { socialService } from '../services/social.service';
import { publicUserView, recipeCardView, userProfileView } from '../views';
import { parsePageParams } from '../utils/pagination';
import { validatedQuery } from '../middlewares/validate';
import { unauthorized } from '../utils/errors';

const requireUser = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user;
};

export const userController = {
  async me(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    const user = await userService.getById(auth.id);
    res.json(userProfileView(user, await userService.counters(user.id)));
  },

  async updateMe(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    const user = await userService.update(auth.id, req.body);
    res.json(userProfileView(user, await userService.counters(user.id)));
  },

  async search(req: Request, res: Response): Promise<void> {
    const query = validatedQuery<{ q?: string; page?: number; limit?: number }>(req);
    const params = parsePageParams(query);
    const { data, meta } = await userService.search(query.q, params);
    const withCounters = await Promise.all(
      data.map(async (user) => publicUserView(user, await userService.counters(user.id))),
    );
    res.json({ data: withCounters, meta });
  },

  async byId(req: Request, res: Response): Promise<void> {
    const user = await userService.getById(String(req.params.id));
    res.json(publicUserView(user, await userService.counters(user.id)));
  },

  async recipes(req: Request, res: Response): Promise<void> {
    const authorId = String(req.params.id);
    await userService.getById(authorId);
    const params = parsePageParams(validatedQuery(req));
    const includeDrafts = req.user?.id === authorId || req.user?.role === 'admin';
    const { data, meta } = await recipeService.byAuthor(authorId, params, includeDrafts);
    res.json({ data: data.map(recipeCardView), meta });
  },

  async follow(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    await userService.follow(auth.id, String(req.params.id));
    res.status(204).send();
  },

  async unfollow(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    await userService.unfollow(auth.id, String(req.params.id));
    res.status(204).send();
  },

  async followers(req: Request, res: Response): Promise<void> {
    const params = parsePageParams(validatedQuery(req));
    const { data, meta } = await userService.followers(String(req.params.id), params);
    res.json({ data: data.map((user) => publicUserView(user)), meta });
  },

  async following(req: Request, res: Response): Promise<void> {
    const params = parsePageParams(validatedQuery(req));
    const { data, meta } = await userService.following(String(req.params.id), params);
    res.json({ data: data.map((user) => publicUserView(user)), meta });
  },

  async favorites(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    const params = parsePageParams(validatedQuery(req));
    const { data, meta } = await socialService.listFavorites(auth.id, params);
    res.json({ data: data.map(recipeCardView), meta });
  },

  async feed(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    const params = parsePageParams(validatedQuery(req));
    const authorIds = await userService.followingIds(auth.id);
    const { data, meta } = await recipeService.feed(authorIds, params);
    res.json({ data: data.map(recipeCardView), meta });
  },
};
