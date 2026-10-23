import cors from "cors";
import express, { Request, Response } from "express";
import { created, error, ok } from "../../common/http";

interface User {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  phone: string | null;
}

const app = express();
const PORT = Number(process.env.PORT) || 4001;

const users: User[] = [
  { id: 1, full_name: "Иван Иванов", email: "ivan@example.com", password_hash: "12345678", phone: "+79990000000" }
];

const publicUser = (user: User) => ({
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  phone: user.phone
});

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => ok(res, { service: "auth", status: "ok" }));

app.post("/auth/register", (req: Request, res: Response) => {
  const { full_name, email, password, phone } = req.body;

  if (!full_name || !email || !password) {
    return error(res, 400, "Некорректные данные");
  }

  if (users.some((user) => user.email === email)) {
    return error(res, 409, "Пользователь с таким email уже существует");
  }

  const user = { id: users.length + 1, full_name, email, password_hash: password, phone: phone || null };
  users.push(user);
  return created(res, { message: "Пользователь зарегистрирован", token: `user-${user.id}`, user: publicUser(user) });
});

app.post("/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = users.find((item) => item.email === email && item.password_hash === password);

  if (!user) {
    return error(res, 401, "Неверный логин или пароль");
  }

  return ok(res, { message: "Успешный вход", token: `user-${user.id}`, user: publicUser(user) });
});

app.get("/auth/me", (req: Request, res: Response) => {
  const userId = Number(req.header("Authorization")?.replace("Bearer user-", ""));
  const user = users.find((item) => item.id === userId);

  if (!user) {
    return error(res, 401, "Пользователь не авторизован");
  }

  return ok(res, publicUser(user));
});

app.get("/internal/users/:id", (req: Request, res: Response) => {
  const user = users.find((item) => item.id === Number(req.params.id));
  return user ? ok(res, publicUser(user)) : error(res, 404, "Пользователь не найден");
});

app.listen(PORT, () => console.log(`Auth Service started on ${PORT}`));
