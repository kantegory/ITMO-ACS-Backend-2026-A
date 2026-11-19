import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities";
import { unauthorized } from "../errors";
import { verifyAccessToken } from "../utils/jwt";

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) {
      throw unauthorized();
    }

    const token = header.slice("Bearer ".length);
    const payload = verifyAccessToken(token);
    const user = await AppDataSource.getRepository(User).findOneBy({ userId: payload.userId });

    if (!user) {
      throw unauthorized();
    }

    req.user = user;
    next();
  } catch (error) {
    next(error instanceof Error ? unauthorized() : error);
  }
};
