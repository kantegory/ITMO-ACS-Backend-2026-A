import { Transform } from 'class-transformer';

export const Trim = () =>
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

export const ToBoolean = () =>
    Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    });

export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
export const PASSWORD_MESSAGE =
    'Пароль: от 8 до 72 символов, минимум одна буква и одна цифра';
