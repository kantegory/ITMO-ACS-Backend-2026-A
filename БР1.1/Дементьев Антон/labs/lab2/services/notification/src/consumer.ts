import { processOnce, startEventConsumer, EventEnvelope } from '@jobsearch/common';

import { dataSource } from './db';
import { EmailLog } from './models/email-log.entity';
import { sendMail } from './mailer';

// ДЗ5: события приходят из RabbitMQ (обмен jobsearch.events) вместо HTTP-эндпоинта /internal/v1/events.
// Очередь notification.identity-events слушает routing key identity.email_requested.
export function startNotificationConsumer() {
    startEventConsumer({
        queue: 'notification.identity-events',
        routingKeys: ['identity.email_requested'],
        handler: async (env: EventEnvelope) => {
            if (env.type !== 'identity.email_requested') return;
            const p = env.payload;
            await processOnce(dataSource, env.event_id, async (m) => {
                sendMail(p.to_email, p.template, p.code, p.ttl_minutes);
                await m.insert(EmailLog, { toEmail: p.to_email, template: p.template, status: 'SENT', sentAt: new Date() });
            });
        },
    });
}
