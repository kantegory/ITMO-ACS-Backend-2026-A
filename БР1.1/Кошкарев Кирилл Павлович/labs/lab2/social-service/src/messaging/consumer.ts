/**
 * Потребитель событий user-service и recipe-service.
 * Поддерживает локальные проекции и каскадно чистит данные удалённых рецептов.
 */
import { AppDataSource } from '../config/data-source';
import {
  Comment, Favorite, Like, ProcessedEvent, RecipeProjection, UserProjection,
} from '../models';
import { bus } from './publisher';
import { EventEnvelope } from './bus';

const QUEUE = 'social.projections';

const alreadyProcessed = async (event: EventEnvelope): Promise<boolean> => {
  const repo = AppDataSource.getRepository(ProcessedEvent);
  if (await repo.findOne({ where: { eventId: event.eventId } })) return true;
  await repo.save(repo.create({ eventId: event.eventId, type: event.type }));
  return false;
};

const upsertUser = async (payload: Record<string, unknown>, occurredAt: Date): Promise<void> => {
  const repo = AppDataSource.getRepository(UserProjection);
  const userId = String(payload.userId);
  const existing = await repo.findOne({ where: { userId } });
  // событие старше уже сохранённого состояния игнорируем (порядок доставки не гарантирован)
  if (existing && existing.syncedAt > occurredAt) return;
  await repo.save(repo.create({
    userId,
    username: String(payload.username ?? ''),
    fullName: (payload.fullName as string | null) ?? null,
    avatarUrl: (payload.avatarUrl as string | null) ?? null,
    syncedAt: occurredAt,
  }));
};

const upsertRecipe = async (payload: Record<string, unknown>, occurredAt: Date): Promise<void> => {
  const repo = AppDataSource.getRepository(RecipeProjection);
  const recipeId = String(payload.recipeId);
  const existing = await repo.findOne({ where: { recipeId } });
  if (existing && existing.syncedAt > occurredAt) return;
  await repo.save(repo.create({
    recipeId,
    title: String(payload.title ?? ''),
    authorId: String(payload.authorId ?? '0'),
    status: String(payload.status ?? 'published'),
    syncedAt: occurredAt,
  }));
};

const purgeRecipe = async (recipeId: string): Promise<void> => {
  await AppDataSource.transaction(async (manager) => {
    await manager.delete(Like, { recipeId });
    await manager.delete(Favorite, { recipeId });
    await manager.delete(Comment, { recipeId });
    await manager.delete(RecipeProjection, { recipeId });
  });
};

export const startProjectionConsumer = async (): Promise<void> => {
  await bus.subscribe(QUEUE, ['user.*', 'recipe.*'], async (event) => {
    if (await alreadyProcessed(event)) return;
    const occurredAt = new Date(event.occurredAt);
    const payload = event.payload as Record<string, unknown>;

    switch (event.type) {
      case 'user.registered':
      case 'user.updated':
        await upsertUser(payload, occurredAt);
        break;
      case 'recipe.published':
      case 'recipe.updated':
        await upsertRecipe(payload, occurredAt);
        break;
      case 'recipe.deleted':
        await purgeRecipe(String(payload.recipeId));
        break;
      default:
        break;
    }
  });
};
