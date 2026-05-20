import { Request, Response } from "express";
import { WorkoutService } from "../services/WorkoutService";
import {
  CreateWorkoutDto,
  UpdateWorkoutDto,
  WorkoutFiltersDto,
} from "../dto/workout.dto";
import { CreateWorkoutCategoryDto } from "../dto/category.dto";
import { validateDto } from "../utils/validate";

const service = new WorkoutService();

export const WorkoutController = {
  async list(req: Request, res: Response) {
    const filters = await validateDto(WorkoutFiltersDto, req.query);
    const result = await service.list(filters);
    res.json(result);
  },

  async getOne(req: Request, res: Response) {
    const w = await service.getById(req.params.id);
    res.json(w);
  },

  async create(req: Request, res: Response) {
    const dto = await validateDto(CreateWorkoutDto, req.body);
    const w = await service.create(dto);
    res.status(201).json(w);
  },

  async update(req: Request, res: Response) {
    const dto = await validateDto(UpdateWorkoutDto, req.body);
    const w = await service.update(req.params.id, dto);
    res.json(w);
  },

  async remove(req: Request, res: Response) {
    await service.delete(req.params.id);
    res.status(204).send();
  },

  async listCategories(_req: Request, res: Response) {
    res.json(await service.listCategories());
  },

  async createCategory(req: Request, res: Response) {
    const dto = await validateDto(CreateWorkoutCategoryDto, req.body);
    const cat = await service.createCategory(
      dto.name,
      dto.description,
      dto.iconUrl,
    );
    res.status(201).json(cat);
  },
};
