import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './data-source';
import { Notification } from './entities/Notification';
import { asyncHandler, errorHandler, authMiddleware, NotFound } from './common';
import { startConsumer, DomainEvent } from './bus';

const PORT = Number(process.env.PORT || 8085);

// Преобразование доменного события в человекочитаемое уведомление.
function render(ev: DomainEvent): { user_id: number; title: string; message: string } | null {
  const d = ev.data || {};
  switch (ev.event) {
    case 'reservation.created':
      return {
        user_id: Number(d.user_id),
        title: 'Бронирование подтверждено',
        message: `Столик #${d.table_id} забронирован на ${d.reservation_date} ${d.reservation_time} (гостей: ${d.guests_count}).`,
      };
    case 'reservation.cancelled':
      return {
        user_id: Number(d.user_id),
        title: 'Бронирование отменено',
        message: `Бронь #${d.reservation_id} на ${d.reservation_date} ${d.reservation_time} отменена.`,
      };
    case 'review.created':
      return {
        user_id: Number(d.user_id),
        title: 'Спасибо за отзыв',
        message: `Ваш отзыв на ресторан #${d.restaurant_id} (оценка ${d.rating}/5) опубликован.`,
      };
    default:
      return null;
  }
}

async function handleEvent(ev: DomainEvent): Promise<void> {
  const r = render(ev);
  if (!r || !Number.isFinite(r.user_id)) {
    console.warn('[notification] skip event without user_id:', ev.event);
    return;
  }
  const repo = AppDataSource.getRepository(Notification);
  const n = repo.create({ user_id: r.user_id, type: ev.event, title: r.title, message: r.message, payload: JSON.stringify(ev.data) });
  await repo.save(n);
  console.log(`[notification] stored "${r.title}" for user ${r.user_id}`);
}

async function main() {
  await AppDataSource.initialize();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification-service' }));

  const api = express.Router();
  // Список уведомлений текущего пользователя (формируются из событий очереди).
  api.get('/notifications', authMiddleware, asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? '20', 10) || 20));
    const [rows, total] = await AppDataSource.getRepository(Notification).findAndCount({
      where: { user_id: req.user!.user_id },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    res.json({
      data: rows.map((n) => ({
        notification_id: n.notification_id,
        type: n.type,
        title: n.title,
        message: n.message,
        created_at: n.created_at,
      })),
      total, page, limit,
    });
  }));
  app.use('/api/v1', api);

  app.use((_req, _res, next) => next(NotFound('Endpoint not found')));
  app.use(errorHandler);
  app.listen(PORT, () => console.log(`[notification-service] listening on :${PORT}`));

  // потребитель очереди — фоном, с собственным переподключением
  startConsumer(handleEvent).catch((e) => console.error('[notification-service] consumer fatal', e));
}

main().catch((e) => { console.error('[notification-service] fatal', e); process.exit(1); });
