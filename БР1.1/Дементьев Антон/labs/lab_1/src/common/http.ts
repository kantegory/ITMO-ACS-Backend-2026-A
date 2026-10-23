import { Response } from 'express';

import SETTINGS from '../config/settings';

// Ответ 201 Created с заголовком Location (адрес созданного ресурса)
export const created = (res: Response, path: string, body: unknown) => {
    res.status(201).location(`${SETTINGS.APP_API_PREFIX}${path}`).json(body);
    return res;
};

// Ответ 204 No Content: операция выполнена, тела ответа нет
export const noContent = (res: Response) => {
    res.status(204).send();
    return res;
};
