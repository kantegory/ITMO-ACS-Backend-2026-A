import { Response } from 'express';

export const API_PREFIX = '/api/v1';

// 201 Created + Location
export const created = (res: Response, path: string, body: unknown) => {
    res.status(201).location(`${API_PREFIX}${path}`).json(body);
    return res;
};
// 204 No Content
export const noContent = (res: Response) => {
    res.status(204).send();
    return res;
};
