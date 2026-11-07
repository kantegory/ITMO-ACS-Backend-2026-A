import { Request, Response } from 'express';
import { socialService } from '../services/social.service';
import { commentView } from '../views';
import { parsePageParams } from '../utils/pagination';
import { validatedQuery } from '../middlewares/validate';
import { unauthorized } from '../utils/errors';

const requireUser = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user;
};

export const socialController = {
  async like(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    res.json(await socialService.like(String(req.params.id), auth.id));
  },

  async unlike(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    res.json(await socialService.unlike(String(req.params.id), auth.id));
  },

  async addFavorite(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    res.json(await socialService.addFavorite(String(req.params.id), auth.id));
  },

  async removeFavorite(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    res.json(await socialService.removeFavorite(String(req.params.id), auth.id));
  },

  async listComments(req: Request, res: Response): Promise<void> {
    const params = parsePageParams(validatedQuery(req));
    const { data, meta } = await socialService.listComments(String(req.params.id), params);
    res.json({ data: data.map(commentView), meta });
  },

  async addComment(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    const comment = await socialService.addComment(
      String(req.params.id),
      auth.id,
      req.body.body,
      req.body.parentId ?? null,
    );
    res.status(201).json(commentView(comment));
  },

  async updateComment(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    const comment = await socialService.updateComment(
      String(req.params.id), auth.id, auth.role, req.body.body,
    );
    res.json(commentView(comment));
  },

  async removeComment(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    await socialService.removeComment(String(req.params.id), auth.id, auth.role);
    res.status(204).send();
  },
};
