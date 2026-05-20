import { Request, Response } from "express";
import { WorkoutPlanService } from "../services/WorkoutPlanService";
import {
  CompleteItemDto,
  CreateWorkoutPlanDto,
  PlanItemInputDto,
  UpdateWorkoutPlanDto,
} from "../dto/workout-plan.dto";
import { validateDto } from "../utils/validate";

const service = new WorkoutPlanService();

export const WorkoutPlanController = {
  async list(req: Request, res: Response) {
    res.json(await service.listForUser(req.user!.sub));
  },

  async getOne(req: Request, res: Response) {
    const plan = await service.getById(req.params.id, req.user!.sub);
    res.json(plan);
  },

  async create(req: Request, res: Response) {
    const dto = await validateDto(CreateWorkoutPlanDto, req.body);
    const plan = await service.create(req.user!.sub, dto);
    res.status(201).json(plan);
  },

  async update(req: Request, res: Response) {
    const dto = await validateDto(UpdateWorkoutPlanDto, req.body);
    const plan = await service.update(req.params.id, req.user!.sub, dto);
    res.json(plan);
  },

  async remove(req: Request, res: Response) {
    await service.delete(req.params.id, req.user!.sub);
    res.status(204).send();
  },

  async addItem(req: Request, res: Response) {
    const dto = await validateDto(PlanItemInputDto, req.body);
    const item = await service.addItem(req.params.id, req.user!.sub, dto);
    res.status(201).json(item);
  },

  async removeItem(req: Request, res: Response) {
    await service.removeItem(req.params.id, req.params.itemId, req.user!.sub);
    res.status(204).send();
  },

  async completeItem(req: Request, res: Response) {
    const dto = await validateDto(CompleteItemDto, req.body);
    const item = await service.setItemCompletion(
      req.params.id,
      req.params.itemId,
      req.user!.sub,
      dto.completed,
    );
    res.json(item);
  },
};
