import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

// расширяем стандартный тип Request из Express добавляем поле user, чтобы потом использовать req.user в контроллерах
interface AuthRequest extends Request {
  user?: { user_id: number; email: string }
}

// middleware — функция, которая выполняется ПЕРЕД контроллером
// req — запрос, res — ответ, next — функция "идём дальше"
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // достаём заголовок из запроса
    const header = req.headers.authorization

    // если заголовка нет или он не начинается с "Bearer " — возвращаем 401
    if (!header || !header.startsWith("Bearer ")) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "нет токена", status: 401 }
      })
      return //  без next() — запрос дальше не идёт
    }

    // отрезаем "Bearer " и получаем сам токен
    // пример: "Bearer eyJhbGciOiJIUzI1NiIs..." → "eyJhbGciOiJIUzI1NiIs..."
    const token = header.split(" ")[1]

    // секретный ключ для проверки подписи токена
    // тот же ключ, которым токен был создан при логине
    const secret = process.env.JWT_SECRET || "secret-key"

    // проверяем токен: не истёк ли, не подделан ли
    // если токен валиден — получаем payload (user_id и email)
    const decoded = jwt.verify(token, secret) as { user_id: number; email: string }

    // добавляем данные пользователя в объект запроса
    // теперь в контроллере можно получить req.user.user_id
    req.user = { user_id: decoded.user_id, email: decoded.email }

    next()
  } catch (err) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "токен невалиден", status: 401 }
    })
    return
  }
}