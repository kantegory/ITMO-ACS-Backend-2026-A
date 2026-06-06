import cors from "cors";
import express, { Request, Response } from "express";
import { created, error, ok } from "../../common/http";

interface StoredUser {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  phone: string | null;
}

const app = express();
const PORT = Number(process.env.AUTH_PORT) || 4001;

const users: StoredUser[] = [
  {
    id: 1,
    full_name: "Иван Иванов",
    email: "ivan@example.com",
    password_hash: "12345678",
    phone: "+79990000000"
  }
];

const publicUser = (user: StoredUser) => ({
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

  const user = {
    id: users.length + 1,
    full_name,
    email,
    password_hash: password,
    phone: phone || null
  };

  users.push(user);
  return created(res, {
    message: "Пользователь успешно зарегистрирован",
    token: `user-${user.id}`,
    user: publicUser(user)
  });
});

app.post("/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = users.find((item) => item.email === email && item.password_hash === password);

  if (!user) {
    return error(res, 401, "Неверный логин или пароль");
  }

  return ok(res, {
    message: "Успешный вход",
    token: `user-${user.id}`,
    user: publicUser(user)
  });
});

app.get("/internal/users/:id", (req: Request, res: Response) => {
  const user = users.find((item) => item.id === Number(req.params.id));

  if (!user) {
    return error(res, 404, "Пользователь не найден");
  }

  return ok(res, publicUser(user));
});

app.get("/auth/me", (req: Request, res: Response) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  const id = Number(token?.replace("user-", ""));
  const user = users.find((item) => item.id === id);

  if (!user) {
    return error(res, 401, "Пользователь не авторизован");
  }

  return ok(res, publicUser(user));
});

app.listen(PORT, () => console.log(`Auth Service started on http://localhost:${PORT}`));
