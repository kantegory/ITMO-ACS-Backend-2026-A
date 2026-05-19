import { NextFunction, Request, Response } from 'express';

type AsyncRoute<TRequest extends Request = Request> = (
    request: TRequest,
    response: Response,
    next: NextFunction,
) => Promise<unknown>;

export const asyncHandler =
    <TRequest extends Request = Request>(route: AsyncRoute<TRequest>) =>
    (request: Request, response: Response, next: NextFunction): void => {
        void route(request as TRequest, response, next).catch(next);
    };
