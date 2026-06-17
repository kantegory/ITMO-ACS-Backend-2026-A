import { Request, Response, NextFunction } from 'express';
import { ApplicationService } from '../services/application.service';

const service = new ApplicationService();

const h =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res);
    } catch (err) {
      next(err);
    }
  };

export const createApplication = h(async (req, res) => {
  res.status(201).json(await service.create(req.user!.sub, req.body));
});

export const getMyApplications = h(async (req, res) => {
  res.json(await service.findMy(req.user!.sub));
});

export const getApplication = h(async (req, res) => {
  res.json(await service.findOne(req.params.applicationId, req.user!.sub, req.user!.role));
});

export const updateStatus = h(async (req, res) => {
  res.json(await service.updateStatus(req.params.applicationId, req.user!.sub, req.body));
});
