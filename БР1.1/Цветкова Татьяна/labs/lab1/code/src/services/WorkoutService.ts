import { Brackets, FindOptionsWhere } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Workout } from "../entities/Workout";
import { WorkoutCategory } from "../entities/WorkoutCategory";
import {
  CreateWorkoutDto,
  UpdateWorkoutDto,
  WorkoutFiltersDto,
} from "../dto/workout.dto";
import { NotFoundError } from "../utils/AppError";

export class WorkoutService {
  private repo = AppDataSource.getRepository(Workout);
  private catRepo = AppDataSource.getRepository(WorkoutCategory);

  async list(filters: WorkoutFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const qb = this.repo
      .createQueryBuilder("w")
      .leftJoinAndSelect("w.category", "c")
      .orderBy("w.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.type) qb.andWhere("w.type = :type", { type: filters.type });
    if (filters.level) qb.andWhere("w.level = :level", { level: filters.level });
    if (filters.minDuration)
      qb.andWhere("w.durationMinutes >= :minD", { minD: filters.minDuration });
    if (filters.maxDuration)
      qb.andWhere("w.durationMinutes <= :maxD", { maxD: filters.maxDuration });
    if (filters.categoryId)
      qb.andWhere("c.id = :catId", { catId: filters.categoryId });
    if (filters.search) {
      qb.andWhere(
        new Brackets((b) => {
          b.where("LOWER(w.title) LIKE :s", {
            s: `%${filters.search!.toLowerCase()}%`,
          }).orWhere("LOWER(w.description) LIKE :s", {
            s: `%${filters.search!.toLowerCase()}%`,
          });
        }),
      );
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async getById(id: string) {
    const w = await this.repo.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!w) throw new NotFoundError("Workout not found");
    return w;
  }

  async create(dto: CreateWorkoutDto) {
    const workout = this.repo.create({
      title: dto.title,
      description: dto.description,
      instructions: dto.instructions,
      videoUrl: dto.videoUrl,
      thumbnailUrl: dto.thumbnailUrl,
      type: dto.type,
      level: dto.level,
      durationMinutes: dto.durationMinutes,
      caloriesBurned: dto.caloriesBurned,
      equipment: dto.equipment,
      muscleGroups: dto.muscleGroups,
    });
    if (dto.categoryId) {
      const cat = await this.catRepo.findOne({ where: { id: dto.categoryId } });
      if (!cat) throw new NotFoundError("Category not found");
      workout.category = cat;
    }
    return this.repo.save(workout);
  }

  async update(id: string, dto: UpdateWorkoutDto) {
    const workout = await this.getById(id);
    Object.assign(workout, dto);
    if (dto.categoryId !== undefined) {
      if (dto.categoryId) {
        const cat = await this.catRepo.findOne({
          where: { id: dto.categoryId },
        });
        if (!cat) throw new NotFoundError("Category not found");
        workout.category = cat;
      } else {
        workout.category = undefined;
      }
    }
    return this.repo.save(workout);
  }

  async delete(id: string) {
    const result = await this.repo.delete({ id } as FindOptionsWhere<Workout>);
    if (!result.affected) throw new NotFoundError("Workout not found");
  }

  // Categories
  async listCategories() {
    return this.catRepo.find({ order: { name: "ASC" } });
  }

  async createCategory(name: string, description?: string, iconUrl?: string) {
    const cat = this.catRepo.create({ name, description, iconUrl });
    return this.catRepo.save(cat);
  }
}
