import { NextFunction, Request, Response } from "express";
import { users } from "../data/store";
import { User } from "../models/types";
import { error } from "../views/apiView";

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authRequired = (req: AuthenticatedRequest, res: Response, next: NextFunction): void | Response => {
  const header = req.header("Authorization");

  if (!header?.startsWith("Bearer ")) {
    return error(res, 401, "Пользователь не авторизован");
  }

  const token = header.replace("Bearer ", "");
  const userId = Number(token.replace("user-", ""));
  const user = users.find((item) => item.user_id === userId);

  if (!user) {
    return error(res, 401, "Пользователь не авторизован");
  }

  req.user = user;
  return next();
};
