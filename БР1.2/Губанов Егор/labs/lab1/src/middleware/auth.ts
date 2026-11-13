import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { verifyAccess } from "../auth/jwt";
import { E } from "../http/errors";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const h = req.headers.authorization;
    if (!h || !h.startsWith("Bearer ")) throw E.unauthorized();
    const token = h.slice(7);
    let payload: { sub: string };
    try {
      payload = verifyAccess(token);
    } catch {
      throw E.unauthorized();
    }
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: payload.sub } });
    if (!user) throw E.unauthorized();
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}
