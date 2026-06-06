import { Response } from "express";

export const ok = <T>(res: Response, data: T): Response => res.json(data);

export const created = <T>(res: Response, data: T): Response => res.status(201).json(data);

export const error = (res: Response, code: number, message: string): Response =>
  res.status(code).json({
    error: {
      code,
      message
    }
  });

export const parseJsonResponse = async <T>(response: globalThis.Response): Promise<T> => {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
};
