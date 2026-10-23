import { Get, JsonController, QueryParams } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import { MailboxQuery } from '../dto/dev.dto';
import { findMails } from '../utils/mailer';

// ТОЛЬКО ДЛЯ ТЕСТОВ. Подключается в app.ts, только если в .env задано MAIL_DEBUG=true.
// Отдаёт «отправленные» письма вместе с кодом, чтобы Postman мог пройти подтверждение email.
@JsonController('/dev')
class DevController {
    @Get('/mailbox')
    @OpenAPI({ summary: '[тест] Письма, отправленные на email (MAIL_DEBUG=true)' })
    mailbox(@QueryParams({ type: MailboxQuery }) query: MailboxQuery) {
        const items = findMails(query.email).map((mail) => ({
            ...mail,
            // код — первые 6 цифр подряд в тексте письма
            code: mail.text.match(/\b\d{6}\b/)?.[0] ?? null,
        }));
        return { items };
    }
}

export default DevController;
