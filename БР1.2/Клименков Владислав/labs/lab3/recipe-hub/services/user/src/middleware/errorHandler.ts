import { 
    Request, 
    Response, 
    NextFunction 
} from 'express';


export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
    console.error(err.message);
    const status = (err as any).status || (err as any).statusCode || 500;
    const message = err.message || 'Что-то пошло не так';
    res.status(status).json({ error: message });
}
