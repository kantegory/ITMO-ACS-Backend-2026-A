import express, { Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const swaggerDocument = YAML.load("./openapi.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (_req: Request, res: Response) => {
  res.send("Restaurant API is running");
});

app.post("/api/auth/register", (req: Request, res: Response) => {
  const { full_name, email, password, phone } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({
      error: {
        code: 400,
        message: "Некорректные данные"
      }
    });
  }

  return res.status(201).json({
    message: "Пользователь успешно зарегистрирован",
    user: {
      id: 1,
      full_name,
      email,
      phone: phone || null
    }
  });
});

app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: {
        code: 400,
        message: "Некорректные данные"
      }
    });
  }

  return res.json({
    message: "Успешный вход",
    token: "fake-jwt-token"
  });
});

app.get("/api/restaurants", (_req: Request, res: Response) => {
  return res.json([
    {
      id: 1,
      name: "Bella Pasta",
      address: "ул. Ленина, 10",
      city: "Санкт-Петербург",
      price_category: "medium"
    }
  ]);
});

app.get("/api/restaurants/:id", (req: Request, res: Response) => {
  return res.json({
    id: Number(req.params.id),
    name: "Bella Pasta",
    description: "Итальянская кухня",
    address: "ул. Ленина, 10",
    city: "Санкт-Петербург",
    price_category: "medium",
    opening_time: "10:00:00",
    closing_time: "23:00:00"
  });
});

app.post("/api/reservations", (req: Request, res: Response) => {
  const { restaurant_id, table_id, reservation_datetime, guest_count } = req.body;

  if (!restaurant_id || !table_id || !reservation_datetime || !guest_count) {
    return res.status(400).json({
      error: {
        code: 400,
        message: "Некорректные данные"
      }
    });
  }

  return res.status(201).json({
    message: "Бронирование создано",
    reservation: {
      id: 1,
      user_id: 1,
      restaurant_id,
      table_id,
      reservation_datetime,
      guest_count,
      status: "confirmed"
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log(`Swagger docs on http://localhost:${PORT}/api-docs`);
});

