import { Request, Response } from "express";
import { nextId, users } from "../data/store";
import { created, error, ok } from "../views/apiView";
import { userView } from "../views/userView";

export const register = (req: Request, res: Response): Response => {
  const { full_name, email, password, phone } = req.body;

  if (!full_name || !email || !password) {
    return error(res, 400, "Некорректные данные");
  }

  if (users.some((user) => user.email === email)) {
    return error(res, 409, "Пользователь с таким email уже существует");
  }

  const user = {
    user_id: nextId(users, "user_id"),
    full_name,
    email,
    password_hash: password,
    phone: phone || null,
    created_at: new Date().toISOString()
  };

  users.push(user);
  return created(res, {
    message: "Пользователь успешно зарегистрирован",
    user: userView(user),
    token: `user-${user.user_id}`
  });
};

export const login = (req: Request, res: Response): Response => {
  const { email, password } = req.body;

  if (!email || !password) {
    return error(res, 400, "Некорректные данные");
  }

  const user = users.find((item) => item.email === email && item.password_hash === password);

  if (!user) {
    return error(res, 401, "Неверный логин или пароль");
  }

  return ok(res, {
    message: "Успешный вход",
    token: `user-${user.user_id}`,
    user: userView(user)
  });
};
