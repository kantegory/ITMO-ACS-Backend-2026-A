import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { internalUserView, publicUserView, userProfileView } from '../views';
import { parsePageParams } from '../utils/pagination';
import { validatedQuery } from '../middlewares/common';
import { unauthorized } from '../utils/errors';

const requireUser = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user;
};

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const { user, tokens } = await userService.register(req.body);
    res.status(201).json({ ...tokens, user: userProfileView(user, await userService.counters(user.id)) });
  },
  async login(req: Request, res: Response): Promise<void> {
    const { user, tokens } = await userService.login(req.body);
    res.json({ ...tokens, user: userProfileView(user, await userService.counters(user.id)) });
  },
  async refresh(req: Request, res: Response): Promise<void> {
    res.json(await userService.refresh(req.body.refreshToken));
  },
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
    const { data, meta } = await userService.search(query.q, parsePageParams(query));
    const withCounters = await Promise.all(
      data.map(async (user) => publicUserView(user, await userService.counters(user.id))),
    );
    res.json({ data: withCounters, meta });
  },
  async byId(req: Request, res: Response): Promise<void> {
    const user = await userService.getById(String(req.params.id));
    res.json(publicUserView(user, await userService.counters(user.id)));
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
    const { data, meta } = await userService.followers(
      String(req.params.id), parsePageParams(validatedQuery(req)),
    );
    res.json({ data: data.map((user) => publicUserView(user)), meta });
  },
  async following(req: Request, res: Response): Promise<void> {
    const { data, meta } = await userService.following(
      String(req.params.id), parsePageParams(validatedQuery(req)),
    );
    res.json({ data: data.map((user) => publicUserView(user)), meta });
  },
};

/** Эндпоинты для межсервисных вызовов (см. hw4/openapi-internal.yaml). */
export const internalController = {
  async usersByIds(req: Request, res: Response): Promise<void> {
    const { ids } = validatedQuery<{ ids: string[] }>(req);
    const users = await userService.byIds(ids);
    res.json({ data: users.map(internalUserView) });
  },
  async following(req: Request, res: Response): Promise<void> {
    res.json({ data: await userService.followingIds(String(req.params.id)) });
  },
  async exists(req: Request, res: Response): Promise<void> {
    try {
      const user = await userService.getById(String(req.params.id));
      res.json({ exists: true, isActive: user.isActive });
    } catch {
      res.json({ exists: false, isActive: false });
    }
  },
};
