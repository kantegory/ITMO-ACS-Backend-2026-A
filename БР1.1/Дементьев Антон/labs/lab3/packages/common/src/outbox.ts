import { randomUUID } from 'crypto';
import { BaseEntity, Column, CreateDateColumn, DataSource, Entity, EntityManager, PrimaryColumn } from 'typeorm';

import { isUniqueViolation } from './validators';
import { publishEnvelope } from './mq';

// Таблица outbox: событие пишется в той же транзакции, что и изменение данных,
// а отдельный процесс публикует его в RabbitMQ (обмен jobsearch.events, routing key = тип события).
@Entity('outbox_events')
export class OutboxEvent extends BaseEntity {
    @PrimaryColumn({ type: 'uuid' }) id: string;
    @Column({ type: 'varchar', length: 100 }) type: string;
    @Column({ type: 'jsonb' }) payload: any;
    @CreateDateColumn() createdAt: Date;
    @Column({ type: 'timestamp', nullable: true }) publishedAt: Date | null;
    @Column({ type: 'int', default: 0 }) attempts: number;
    @Column({ type: 'timestamp' }) nextAttemptAt: Date;
}

// Таблица inbox: id обработанных событий (повторная доставка не выполняется дважды)
@Entity('inbox_events')
export class InboxEvent extends BaseEntity {
    @PrimaryColumn({ type: 'uuid' }) eventId: string;
    @CreateDateColumn() processedAt: Date;
}

export interface EventEnvelope { event_id: string; type: string; version: number; occurred_at: string; payload: any }

export const publishEvent = async (manager: EntityManager, type: string, payload: any) => {
    await manager.insert(OutboxEvent, { id: randomUUID(), type, payload, nextAttemptAt: new Date() });
};

let dispatcher: { run: () => Promise<void> } | undefined;
export const dispatchSoon = () => { if (dispatcher) setImmediate(() => dispatcher!.run().catch(() => undefined)); };

// Публикует накопленные события в RabbitMQ (обмен jobsearch.events, topic-роутинг по типу события).
// Получатели сами решают, какие routing key их интересуют (см. startEventConsumer в mq.ts) —
// издателю не нужно знать список подписчиков, в отличие от прежней HTTP-версии.
export function startOutboxDispatcher(ds: DataSource, intervalMs = 2000) {
    let busy = false;
    const run = async () => {
        if (busy) return;
        busy = true;
        try {
            const repo = ds.getRepository(OutboxEvent);
            const list = await repo.createQueryBuilder('e').where('e.publishedAt IS NULL AND e.nextAttemptAt <= :now', { now: new Date() })
                .orderBy('e.createdAt', 'ASC').limit(50).getMany();
            for (const e of list) {
                const env: EventEnvelope = { event_id: e.id, type: e.type, version: 1, occurred_at: e.createdAt.toISOString(), payload: e.payload };
                try {
                    await publishEnvelope(e.type, env);
                    await repo.update(e.id, { publishedAt: new Date() });
                } catch (err: any) {
                    const attempts = e.attempts + 1;
                    await repo.update(e.id, { attempts, nextAttemptAt: new Date(Date.now() + Math.min(2 ** attempts, 60) * 1000) });
                    console.warn(`Событие ${e.type} (${e.id}) не опубликовано в RabbitMQ, попытка ${attempts}: ${err?.code || err?.message}`);
                }
            }
        } finally { busy = false; }
    };
    dispatcher = { run };
    setInterval(() => run().catch(() => undefined), intervalMs);
}

// Обрабатывает событие один раз: id записывается в inbox в той же транзакции, что и результат.
export async function processOnce(ds: DataSource, eventId: string, fn: (m: EntityManager) => Promise<void>): Promise<boolean> {
    try {
        await ds.transaction(async (m) => {
            await m.insert(InboxEvent, { eventId });
            await fn(m);
        });
        return true;
    } catch (e) {
        if (isUniqueViolation(e)) return false;
        throw e;
    }
}
