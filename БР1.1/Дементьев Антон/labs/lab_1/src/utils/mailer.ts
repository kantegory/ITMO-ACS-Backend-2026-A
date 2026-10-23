import SETTINGS from '../config/settings';

export interface SentMail {
    to: string;
    subject: string;
    text: string;
    sent_at: string;
}

// Тестовый «почтовый ящик»: последние отправленные письма хранятся в памяти сервера.
// Работает только при MAIL_DEBUG=true и нужен, чтобы автотесты (Postman) могли получить код подтверждения.
const outbox: SentMail[] = [];

// «Отправка» писем. Настоящего почтового сервера в лабе нет,
// поэтому письмо печатается в терминал, где запущен сервер.
export const sendMail = (to: string, subject: string, text: string): void => {
    console.log('\n========== ПИСЬМО (имитация отправки) ==========');
    console.log(`Кому:  ${to}`);
    console.log(`Тема:  ${subject}`);
    console.log(`Текст: ${text}`);
    console.log('================================================\n');

    if (SETTINGS.MAIL_DEBUG) {
        outbox.unshift({ to: to.toLowerCase(), subject, text, sent_at: new Date().toISOString() });
        if (outbox.length > 200) outbox.pop();
    }
};

// Письма, отправленные на адрес (новые первыми)
export const findMails = (to: string): SentMail[] =>
    outbox.filter((mail) => mail.to === to.trim().toLowerCase());
