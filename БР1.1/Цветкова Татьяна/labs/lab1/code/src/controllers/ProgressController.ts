import { Request, Response } from "express";
import { ProgressService } from "../services/ProgressService";
import {
  CreateProgressDto,
  ProgressFiltersDto,
} from "../dto/progress.dto";
import { validateDto } from "../utils/validate";

const service = new ProgressService();

export const ProgressController = {
  async list(req: Request, res: Response) {
    const filters = await validateDto(ProgressFiltersDto, req.query);
    res.json(await service.list(req.user!.sub, filters));
  },

  async create(req: Request, res: Response) {
    const dto = await validateDto(CreateProgressDto, req.body);
    const entry = await service.create(req.user!.sub, dto);
    res.status(201).json(entry);
  },

  async remove(req: Request, res: Response) {
    await service.delete(req.user!.sub, req.params.id);
    res.status(204).send();
  },

  async stats(req: Request, res: Response) {
    res.json(await service.stats(req.user!.sub));
  },
};
