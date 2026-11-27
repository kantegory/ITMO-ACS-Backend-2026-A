import { Request, Response } from 'express';
import { CategoryService } from './category.service';
import { successResponse, errorResponse } from '../../common/dto';
import { AuthRequest } from '../../middleware/auth.middleware';
import { parseIdParam } from '../../utils/parse-id-param';

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  // Публичный - список активных категорий
  list = async (req: Request, res: Response) => {
    try {
      const categories = await this.categoryService.findAll();
      res.status(200).json(successResponse(categories));
    } catch (error: any) {
      res.status(400).json(errorResponse(400, error.message));
    }
  };

  // ADMIN только
  listAll = async (req: AuthRequest, res: Response) => {
    try {
      const categories = await this.categoryService.findAllAdmin();
      res.status(200).json(successResponse(categories));
    } catch (error: any) {
      res.status(400).json(errorResponse(400, error.message));
    }
  };

  // ADMIN только
  create = async (req: AuthRequest, res: Response) => {
    try {
      const category = await this.categoryService.create(req.body);
      res.status(201).json(successResponse(category));
    } catch (error: any) {
      if (error.message === 'Category with this title already exists') {
        res.status(409).json(errorResponse(409, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  // ADMIN только
  update = async (req: AuthRequest, res: Response) => {
    try {
      const id = parseIdParam(req.params.id, 'id');
      const category = await this.categoryService.update(id, req.body);
      res.status(200).json(successResponse(category));
    } catch (error: any) {
      if (error.message === 'Category not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else if (error.message === 'Category with this title already exists') {
        res.status(409).json(errorResponse(409, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  // ADMIN только
  delete = async (req: AuthRequest, res: Response) => {
    try {
      const id = parseIdParam(req.params.id, 'id');
      await this.categoryService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Category not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };
}