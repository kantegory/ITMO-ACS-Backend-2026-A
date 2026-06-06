import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export function validateDto(DtoClass: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToInstance(DtoClass, req.body);
    const errors = await validate(dto, { whitelist: true });

    if (errors.length > 0) {
      const messages = errors
        .map((err) => `${err.property}: ${Object.values(err.constraints || {}).join(', ')}`)
        .join('; ');

      return res.status(422).json({ error: 'Validation failed', details: messages });
    }

    next();
  };
}