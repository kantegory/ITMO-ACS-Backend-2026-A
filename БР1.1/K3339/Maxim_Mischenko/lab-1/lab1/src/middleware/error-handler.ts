import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.message,
      },
    });
  }

  // Handle TypeORM errors
  if (error.name === 'QueryFailedError') {
    // Check for duplicate key error
    if ((error as any).code === '23505') {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'Resource already exists',
        },
      });
    }

    // Check for foreign key constraint error
    if ((error as any).code === '23503') {
      return res.status(404).json({
        error: {
          code: 'RELATED_RESOURCE_NOT_FOUND',
          message: 'Related resource not found',
        },
      });
    }
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
    });
  }

  // Default error
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};
