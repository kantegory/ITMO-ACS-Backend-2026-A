import { Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate as classValidate } from 'class-validator';

export const validate = (DtoClass: new (...args: any[]) => object) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const dto = plainToInstance(DtoClass, req.body);
    const errors = await classValidate(dto, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });
    if (errors.length > 0) {
      const formatted = errors.map((err) => ({
        field: err.property,
        message: Object.values(err.constraints || {}).join(', '),
      }));
      res.status(422).json({
        statusCode: 422,
        message: 'Validation failed',
        errors: formatted,
      });
      return;
    }
    req.body = dto;
    next();
  };
};
