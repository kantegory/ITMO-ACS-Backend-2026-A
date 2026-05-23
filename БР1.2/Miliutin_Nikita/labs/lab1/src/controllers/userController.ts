import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { error, ok } from "../views/apiView";
import { userView } from "../views/userView";

export const getProfile = (req: AuthenticatedRequest, res: Response): Response => {
  if (!req.user) {
    return error(res, 401, "Пользователь не авторизован");
  }

  return ok(res, userView(req.user));
};

export const updateProfile = (req: AuthenticatedRequest, res: Response): Response => {
  if (!req.user) {
    return error(res, 401, "Пользователь не авторизован");
  }

  const { full_name, phone } = req.body;

  if (!full_name && phone === undefined) {
    return error(res, 400, "Некорректные данные");
  }

  req.user.full_name = full_name || req.user.full_name;
  req.user.phone = phone === undefined ? req.user.phone : phone;

  return ok(res, {
    message: "Профиль обновлен",
    user: userView(req.user)
  });
};
