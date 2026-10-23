import { ErrorCode, fail } from './errors';

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
    typeof value === 'string' && UUID_RE.test(value);

// Проверяет, что id из адреса запроса похож на UUID; иначе объект «не найден» (404).
// Так мы не отправляем в базу мусор вместо UUID (это привело бы к ошибке 500).
export const uuidParam = (value: string, notFound: ErrorCode): string => {
    if (!isUuid(value)) throw fail(notFound);
    return value;
};

// Нарушение уникальности в PostgreSQL (например, повторный email)
export const isUniqueViolation = (error: any): boolean =>
    error?.code === '23505' || error?.driverError?.code === '23505';

// Экранирует символы % и _ в строке для поиска через ILIKE
export const escapeLike = (value: string): string =>
    value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
