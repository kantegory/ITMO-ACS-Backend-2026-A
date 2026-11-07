import { badRequest } from "./errors";

const NUMERIC_ID = /^\d+$/;

export const parseNumericId = (value: string | undefined, name = "id"): string => {
  if (!value || !NUMERIC_ID.test(value)) {
    throw badRequest(`Некорректный ${name}`, "invalid_id");
  }
  return value;
};
