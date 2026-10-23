// «Отправка» писем: настоящего почтового сервера в лабе нет, письмо печатается в журнал сервиса.
// При MAIL_DEBUG=true письма (вместе с кодом) сохраняются в памяти для тестового ящика.
export interface SentMail { to: string; subject: string; template: string; code: string | null; sent_at: string }
const outbox: SentMail[] = [];
export const MAIL_DEBUG = process.env.MAIL_DEBUG === 'true';

const SUBJECTS: Record<string, string> = { EMAIL_VERIFICATION: 'Подтверждение email', PASSWORD_CHANGE: 'Подтверждение смены пароля' };

export const sendMail = (to: string, template: string, code: string, ttlMinutes: number) => {
    const subject = SUBJECTS[template] || 'Письмо';
    console.log('\n========== ПИСЬМО (имитация отправки) ==========');
    console.log(`Кому:  ${to}\nТема:  ${subject}\nТекст: Ваш код: ${code}. Он действует ${ttlMinutes} минут.`);
    console.log('================================================\n');
    if (MAIL_DEBUG) {
        outbox.unshift({ to: to.toLowerCase(), subject, template, code, sent_at: new Date().toISOString() });
        if (outbox.length > 200) outbox.pop();
    }
};
export const findMails = (to: string) => outbox.filter((m) => m.to === to.trim().toLowerCase());
