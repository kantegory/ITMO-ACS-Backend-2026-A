import { plainToInstance, ClassConstructor } from "class-transformer";
import { validate } from "class-validator";
import { ValidationError as AppValidationError } from "./AppError";

export const validateDto = async <T extends object>(
  cls: ClassConstructor<T>,
  payload: object,
): Promise<T> => {
  const instance = plainToInstance(cls, payload, {
    enableImplicitConversion: true,
  });
  const errors = await validate(instance as object, {
    whitelist: true,
    forbidNonWhitelisted: false,
  });
  if (errors.length > 0) {
    const details = errors.map((e) => ({
      property: e.property,
      constraints: e.constraints,
    }));
    throw new AppValidationError(details);
  }
  return instance;
};
