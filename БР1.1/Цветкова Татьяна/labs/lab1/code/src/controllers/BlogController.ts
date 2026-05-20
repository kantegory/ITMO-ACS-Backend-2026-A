import { Request, Response } from "express";
import { BlogService } from "../services/BlogService";
import {
  BlogFiltersDto,
  CreateBlogPostDto,
  CreateCommentDto,
  UpdateBlogPostDto,
} from "../dto/blog.dto";
import { CreateBlogCategoryDto } from "../dto/category.dto";
import { validateDto } from "../utils/validate";
import { UserRole } from "../entities/User";

const service = new BlogService();

export const BlogController = {
  async list(req: Request, res: Response) {
    const filters = await validateDto(BlogFiltersDto, req.query);
    res.json(await service.list(filters));
  },

  async getOne(req: Request, res: Response) {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-/i.test(id);
    const post = isUuid
      ? await service.getById(id)
      : await service.getBySlug(id);
    res.json(post);
  },

  async create(req: Request, res: Response) {
    const dto = await validateDto(CreateBlogPostDto, req.body);
    const post = await service.create(req.user!.sub, dto);
    res.status(201).json(post);
  },

  async update(req: Request, res: Response) {
    const dto = await validateDto(UpdateBlogPostDto, req.body);
    res.json(await service.update(req.params.id, dto));
  },

  async remove(req: Request, res: Response) {
    await service.delete(req.params.id);
    res.status(204).send();
  },

  async listCategories(_req: Request, res: Response) {
    res.json(await service.listCategories());
  },

  async createCategory(req: Request, res: Response) {
    const dto = await validateDto(CreateBlogCategoryDto, req.body);
    const cat = await service.createCategory(dto.name, dto.slug, dto.description);
    res.status(201).json(cat);
  },

  async listComments(req: Request, res: Response) {
    res.json(await service.listComments(req.params.id));
  },

  async addComment(req: Request, res: Response) {
    const dto = await validateDto(CreateCommentDto, req.body);
    const comment = await service.addComment(
      req.params.id,
      req.user!.sub,
      dto,
    );
    res.status(201).json(comment);
  },

  async deleteComment(req: Request, res: Response) {
    await service.deleteComment(
      req.params.commentId,
      req.user!.sub,
      req.user!.role === UserRole.ADMIN,
    );
    res.status(204).send();
  },
};
