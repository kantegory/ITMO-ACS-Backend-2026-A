import { Response } from "express";

export const ok = <T>(res: Response, data: T): Response => res.json(data);

export const created = <T>(res: Response, data: T): Response => res.status(201).json(data);

export const message = (res: Response, text: string): Response => res.json({ message: text });

export const error = (res: Response, code: number, text: string): Response =>
  res.status(code).json({
    error: {
      code,
      message: text
    }
  });
