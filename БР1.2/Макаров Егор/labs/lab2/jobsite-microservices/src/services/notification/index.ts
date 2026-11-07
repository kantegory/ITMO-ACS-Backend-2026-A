import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Router, Request, Response } from 'express';
import { env } from '../../common/env';
import { createServiceApp } from '../../common/createApp';
import { asyncHandler, authenticate, requireRole, getPageParams, buildMeta } from '../../common/http';
import { UserRole } from '../../common/enums';
import { callService } from '../../common/internalClient';
import { consumeEvent } from '../../common/rabbit';
import { Notification } from './entities/Notification';

export const dataSource = new DataSource({
  type: 'postgres',
  host: env.db.host, port: env.db.port, username: env.db.user, password: env.db.password,
  database: env.db.name, synchronize: true, logging: false, entities: [Notification],
});

const repo = () => dataSource.getRepository(Notification);
const employerOnly = requireRole(UserRole.EMPLOYER);

const present = (n: Notification) => ({
  id: n.id, company_id: n.companyId, type: n.type, message: n.message,
  application_id: n.applicationId ?? null, vacancy_id: n.vacancyId ?? null,
  is_read: n.isRead, created_at: n.createdAt,
});

const companyOfUser = async (userId: number): Promise<number | null> =>
  (await callService<{ company_id: number | null }>('employer', `/internal/employers/by-user/${userId}`))!.company_id;

const routes = Router();

// уведомления текущего работодателя (его компании)
routes.get('/notifications', authenticate, employerOnly, asyncHandler(async (req: Request, res: Response) => {
  const companyId = await companyOfUser(req.user!.id);
  const { page, limit, skip, take } = getPageParams(req.query);
  if (!companyId) { res.json({ data: [], meta: buildMeta(page, limit, 0) }); return; }
  const [items, total] = await repo().findAndCount({
    where: { companyId }, skip, take, order: { createdAt: 'DESC' },
  });
  res.json({ data: items.map(present), meta: buildMeta(page, limit, total) });
}));

export const app = createServiceApp('notification', routes);

// Подписка на события RabbitMQ — запускается bootstrap после инициализации БД
export const onReady = async (): Promise<void> => {
  await consumeEvent('notification.application-created', 'application.created', async (payload) => {
    const companyId = Number(payload.company_id);
    const notification = repo().create({
      companyId,
      type: 'application_created',
      message: `Новый отклик на вакансию #${payload.vacancy_id}`,
      applicationId: payload.application_id ? Number(payload.application_id) : null,
      vacancyId: payload.vacancy_id ? Number(payload.vacancy_id) : null,
    });
    await repo().save(notification);
    // eslint-disable-next-line no-console
    console.log(`[notification] создано уведомление для компании ${companyId}`);
  });
};
