import { Request, Response } from 'express';
import { socialService } from '../services/social.service';
import { commentView } from '../views';
import { parsePageParams } from '../utils/pagination';
import { validatedQuery } from '../middlewares/common';
import { unauthorized } from '../utils/errors';

const requireUser = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user;
};

export const socialController = {
  async like(req: Request, res: Response): Promise<void> {
    res.json(await socialService.like(String(req.params.id), requireUser(req).id));
  },
  async unlike(req: Request, res: Response): Promise<void> {
    res.json(await socialService.unlike(String(req.params.id), requireUser(req).id));
  },
  async addFavorite(req: Request, res: Response): Promise<void> {
    res.json(await socialService.addFavorite(String(req.params.id), requireUser(req).id));
  },
  async removeFavorite(req: Request, res: Response): Promise<void> {
    res.json(await socialService.removeFavorite(String(req.params.id), requireUser(req).id));
  },
  async listComments(req: Request, res: Response): Promise<void> {
    const { data, meta } = await socialService.listComments(
      String(req.params.id), parsePageParams(validatedQuery(req)),
    );
    res.json({ data: data.map((row) => commentView(row.comment, row.author)), meta });
  },
  async addComment(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    const { comment, author } = await socialService.addComment(
      String(req.params.id), auth.id, req.body.body, req.body.parentId ?? null,
    );
    res.status(201).json(commentView(comment, author));
  },
  async updateComment(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    const { comment, author } = await socialService.updateComment(
      String(req.params.id), auth.id, auth.role, req.body.body,
    );
    res.json(commentView(comment, author));
  },
  async removeComment(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    await socialService.removeComment(String(req.params.id), auth.id, auth.role);
    res.status(204).send();
  },
  async myFavorites(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    const { data, meta } = await socialService.favoriteIds(auth.id, parsePageParams(validatedQuery(req)));
    res.json({ data, meta });
  },
};

export const internalController = {
  async reactionStates(req: Request, res: Response): Promise<void> {
    const query = validatedQuery<{ ids: string[]; userId?: number }>(req);
    const states = await socialService.reactionStates(
      query.ids, query.userId ? String(query.userId) : undefined,
    );
    res.json({ data: states });
  },
  async favorites(req: Request, res: Response): Promise<void> {
    const { data, meta } = await socialService.favoriteIds(
      String(req.params.userId), parsePageParams(validatedQuery(req)),
    );
    res.json({ data, meta });
  },
};
