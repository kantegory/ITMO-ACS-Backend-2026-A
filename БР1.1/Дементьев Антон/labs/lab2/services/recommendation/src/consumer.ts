import { processOnce, startEventConsumer, EventEnvelope } from '@jobsearch/common';

import { dataSource } from './db';
import { deleteResume, deleteVacancy, upsertResume, upsertVacancy } from './indexer';

// ДЗ5: события каталога приходят из RabbitMQ (обмен jobsearch.events) вместо HTTP-эндпоинта /internal/v1/events.
// Очередь recommendation.catalog-events слушает вакансии и резюме — источники для индекса рекомендаций.
export function startRecommendationConsumer() {
    startEventConsumer({
        queue: 'recommendation.catalog-events',
        routingKeys: ['vacancy.upserted', 'vacancy.deleted', 'resume.upserted', 'resume.deleted'],
        handler: async (env: EventEnvelope) => {
            await processOnce(dataSource, env.event_id, async (m) => {
                const p = env.payload;
                if (env.type === 'vacancy.upserted') await upsertVacancy(m, p);
                else if (env.type === 'vacancy.deleted') await deleteVacancy(m, p.vacancy_id);
                else if (env.type === 'resume.upserted') await upsertResume(m, p);
                else if (env.type === 'resume.deleted') await deleteResume(m, p.resume_id);
            });
        },
    });
}
