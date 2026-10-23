import { Transform } from 'class-transformer';

// Убирает пробелы по краям у строк: "  Антон " -> "Антон"
export const Trim = () =>
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

// Превращает "true"/"false" из адресной строки в настоящие boolean
export const ToBoolean = () =>
    Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    });

// Пароль: 8–72 символа, минимум одна буква и одна цифра
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
export const PASSWORD_MESSAGE =
    'Пароль: от 8 до 72 символов, минимум одна буква и одна цифра';
