import { ValidationErrorDetail, validationError } from "../errors";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[1-9][0-9]{7,14}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

export const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value.trim() : undefined;

export const asPositiveInt = (value: unknown): number | undefined => {
  const raw = typeof value === "string" ? Number(value) : value;
  return Number.isInteger(raw) && Number(raw) > 0 ? Number(raw) : undefined;
};

export const isEmail = (value: string) => emailRegex.test(value);
export const isPhone = (value: string) => phoneRegex.test(value);
export const isDate = (value: string) => dateRegex.test(value) && !Number.isNaN(Date.parse(value));
export const isTime = (value: string) => timeRegex.test(value);

export const normalizeTime = (value: string): string => (value.length === 5 ? `${value}:00` : value);

export const ensureValid = (details: ValidationErrorDetail[]) => {
  if (details.length > 0) {
    throw validationError(details);
  }
};

export const validateRequiredString = (
  details: ValidationErrorDetail[],
  value: unknown,
  field: string,
  maxLength: number,
): string => {
  const text = asString(value);
  if (!text) {
    details.push({ field, message: "Поле обязательно для заполнения." });
    return "";
  }
  if (text.length > maxLength) {
    details.push({ field, message: `Максимальная длина: ${maxLength}.` });
  }
  return text;
};

export const validateEmail = (details: ValidationErrorDetail[], value: unknown): string => {
  const email = validateRequiredString(details, value, "email", 255).toLowerCase();
  if (email && !isEmail(email)) {
    details.push({ field: "email", message: "Некорректный email." });
  }
  return email;
};

export const validatePhone = (details: ValidationErrorDetail[], value: unknown): string => {
  const phone = validateRequiredString(details, value, "phone", 32);
  if (phone && !isPhone(phone)) {
    details.push({ field: "phone", message: "Некорректный номер телефона." });
  }
  return phone;
};

export const validatePassword = (details: ValidationErrorDetail[], value: unknown): string => {
  const password = validateRequiredString(details, value, "password", 128);
  if (password && password.length < 8) {
    details.push({ field: "password", message: "Пароль должен быть не короче 8 символов." });
  }
  return password;
};
