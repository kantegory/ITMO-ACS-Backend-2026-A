import { Between, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { ProgressEntry } from "../entities/ProgressEntry";
import { Workout } from "../entities/Workout";
import { User } from "../entities/User";
import {
  CreateProgressDto,
  ProgressFiltersDto,
} from "../dto/progress.dto";
import { NotFoundError } from "../utils/AppError";

export class ProgressService {
  private repo = AppDataSource.getRepository(ProgressEntry);
  private workoutRepo = AppDataSource.getRepository(Workout);
  private userRepo = AppDataSource.getRepository(User);

  async list(userId: string, filters: ProgressFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const where: Record<string, unknown> = { user: { id: userId } };
    if (filters.from && filters.to) {
      where.performedAt = Between(
        new Date(filters.from),
        new Date(filters.to),
      );
    } else if (filters.from) {
      where.performedAt = MoreThanOrEqual(new Date(filters.from));
    } else if (filters.to) {
      where.performedAt = LessThanOrEqual(new Date(filters.to));
    }

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { performedAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async create(userId: string, dto: CreateProgressDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");
    const entry = this.repo.create({
      user,
      durationMinutes: dto.durationMinutes,
      caloriesBurned: dto.caloriesBurned,
      weightKg: dto.weightKg,
      rating: dto.rating,
      notes: dto.notes,
      performedAt: new Date(dto.performedAt),
    });
    if (dto.workoutId) {
      const workout = await this.workoutRepo.findOne({
        where: { id: dto.workoutId },
      });
      if (!workout) throw new NotFoundError("Workout not found");
      entry.workout = workout;
    }
    return this.repo.save(entry);
  }

  async delete(userId: string, id: string) {
    const result = await this.repo.delete({ id, user: { id: userId } });
    if (!result.affected) throw new NotFoundError("Progress entry not found");
  }

  async stats(userId: string) {
    const raw = await this.repo
      .createQueryBuilder("p")
      .select("COUNT(*)", "totalEntries")
      .addSelect("COALESCE(SUM(p.durationMinutes), 0)", "totalMinutes")
      .addSelect("COALESCE(SUM(p.caloriesBurned), 0)", "totalCalories")
      .addSelect("COALESCE(AVG(p.rating), 0)", "averageRating")
      .where("p.userId = :userId", { userId })
      .getRawOne<{
        totalEntries: string;
        totalMinutes: string;
        totalCalories: string;
        averageRating: string;
      }>();

    return {
      totalEntries: Number(raw?.totalEntries ?? 0),
      totalMinutes: Number(raw?.totalMinutes ?? 0),
      totalCalories: Number(raw?.totalCalories ?? 0),
      averageRating: Number(raw?.averageRating ?? 0),
    };
  }
}
