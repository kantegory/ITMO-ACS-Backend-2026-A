import { AppDataSource } from "../config/data-source";
import { WorkoutPlan } from "../entities/WorkoutPlan";
import { PlanItem } from "../entities/PlanItem";
import { Workout } from "../entities/Workout";
import { User } from "../entities/User";
import {
  CreateWorkoutPlanDto,
  PlanItemInputDto,
  UpdateWorkoutPlanDto,
} from "../dto/workout-plan.dto";
import {
  ForbiddenError,
  NotFoundError,
} from "../utils/AppError";

export class WorkoutPlanService {
  private planRepo = AppDataSource.getRepository(WorkoutPlan);
  private itemRepo = AppDataSource.getRepository(PlanItem);
  private workoutRepo = AppDataSource.getRepository(Workout);

  async listForUser(userId: string) {
    return this.planRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: "DESC" },
    });
  }

  async getById(id: string, userId: string) {
    const plan = await this.planRepo.findOne({
      where: { id },
      relations: { user: true, items: { workout: true } },
    });
    if (!plan) throw new NotFoundError("Plan not found");
    if (plan.user.id !== userId) throw new ForbiddenError();
    return plan;
  }

  async create(userId: string, dto: CreateWorkoutPlanDto) {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: userId },
    });
    if (!user) throw new NotFoundError("User not found");

    const plan = this.planRepo.create({
      title: dto.title,
      description: dto.description,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      user,
    });

    if (dto.items?.length) {
      plan.items = await this.buildItems(dto.items);
    }

    return this.planRepo.save(plan);
  }

  async update(id: string, userId: string, dto: UpdateWorkoutPlanDto) {
    const plan = await this.getById(id, userId);
    Object.assign(plan, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : plan.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : plan.endDate,
    });
    return this.planRepo.save(plan);
  }

  async delete(id: string, userId: string) {
    const plan = await this.getById(id, userId);
    await this.planRepo.remove(plan);
  }

  async addItem(planId: string, userId: string, input: PlanItemInputDto) {
    const plan = await this.getById(planId, userId);
    const [item] = await this.buildItems([input]);
    item.plan = plan;
    return this.itemRepo.save(item);
  }

  async removeItem(planId: string, itemId: string, userId: string) {
    const plan = await this.getById(planId, userId);
    const item = plan.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundError("Plan item not found");
    await this.itemRepo.remove(item);
  }

  async setItemCompletion(
    planId: string,
    itemId: string,
    userId: string,
    completed: boolean,
  ) {
    const plan = await this.getById(planId, userId);
    const item = plan.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundError("Plan item not found");
    item.completed = completed;
    return this.itemRepo.save(item);
  }

  private async buildItems(inputs: PlanItemInputDto[]): Promise<PlanItem[]> {
    const items: PlanItem[] = [];
    for (const input of inputs) {
      const workout = await this.workoutRepo.findOne({
        where: { id: input.workoutId },
      });
      if (!workout)
        throw new NotFoundError(`Workout ${input.workoutId} not found`);
      items.push(
        this.itemRepo.create({
          workout,
          dayOffset: input.dayOffset ?? 0,
          orderIndex: input.orderIndex ?? 0,
          notes: input.notes,
        }),
      );
    }
    return items;
  }
}
