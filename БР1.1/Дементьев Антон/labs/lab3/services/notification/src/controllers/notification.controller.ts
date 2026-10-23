import { IsEmail } from 'class-validator';
import { Get, JsonController, QueryParams } from 'routing-controllers';
import { fail } from '@jobsearch/common';

import { findMails, MAIL_DEBUG } from '../mailer';

class MailboxQuery { @IsEmail() email: string }

// Приём события identity.email_requested теперь выполняет consumer.ts (RabbitMQ), а не HTTP-эндпоинт —
// см. ДЗ5: startNotificationConsumer() в app.ts.
@JsonController('/internal/v1')
class NotificationController {
    // ТОЛЬКО ДЛЯ ТЕСТОВ (MAIL_DEBUG=true): письма с кодом. Если письма ещё нет, ждёт его до 3 секунд.
    @Get('/dev/mailbox')
    async mailbox(@QueryParams({ type: MailboxQuery }) q: MailboxQuery) {
        if (!MAIL_DEBUG) throw fail('NOT_FOUND');
        for (let i = 0; i < 30; i++) {
            const items = findMails(q.email);
            if (items.length) return { items };
            await new Promise((r) => setTimeout(r, 100));
        }
        return { items: [] };
    }
}
export default NotificationController;
