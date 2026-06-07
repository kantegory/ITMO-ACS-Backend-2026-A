import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { errorResponse } from '../common/dto';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      req.body = validated.body;
      req.query = validated.query;
      req.params = validated.params;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, unknown> = {};
        error.errors.forEach((e) => {
          const path = e.path.join('.');
          details[path] = e.message;
        });
        res.status(400).json(errorResponse(400, 'Validation failed', details));
      } else {
        next(error);
      }
    }
  };
};