/**
 * Потребитель событий social-service: поддерживает денормализованные счётчики
 * likes_count и comments_count рецептов.
 *
 * Идемпотентность: eventId сохраняется в processed_events, повторная доставка
 * (at-least-once) не изменяет счётчики дважды.
 */
import { AppDataSource } from '../config/data-source';
import { ProcessedEvent, Recipe } from '../models';
import { bus } from './publisher';
import { EventEnvelope } from './bus';

const QUEUE = 'recipe.counters';

const alreadyProcessed = async (event: EventEnvelope): Promise<boolean> => {
  const repo = AppDataSource.getRepository(ProcessedEvent);
  if (await repo.findOne({ where: { eventId: event.eventId } })) return true;
  await repo.save(repo.create({ eventId: event.eventId, type: event.type }));
  return false;
};

const applyDelta = async (
  recipeId: number,
  column: 'likesCount' | 'commentsCount',
  delta: number,
): Promise<void> => {
  // Одним атомарным UPDATE: не перетираем параллельные изменения и не уходим ниже нуля.
  await AppDataSource.getRepository(Recipe).query(
    `UPDATE recipes SET "${column}" = GREATEST("${column}" + $2, 0) WHERE id = $1`,
    [recipeId, delta],
  );
};

export const startCounterConsumer = async (): Promise<void> => {
  await bus.subscribe(QUEUE, ['social.recipe.*', 'social.comment.*'], async (event) => {
    if (await alreadyProcessed(event)) return;
    const data = event.payload as { recipeId: number; delta: number };
    if (!data?.recipeId) return;

    if (event.type === 'social.recipe.liked' || event.type === 'social.recipe.unliked') {
      await applyDelta(data.recipeId, 'likesCount', data.delta ?? 0);
    }
    if (event.type === 'social.comment.created' || event.type === 'social.comment.deleted') {
      await applyDelta(data.recipeId, 'commentsCount', data.delta ?? 0);
    }
  });
};
