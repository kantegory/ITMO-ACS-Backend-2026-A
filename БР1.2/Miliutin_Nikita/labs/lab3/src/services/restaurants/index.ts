import cors from "cors";
import express, { Request, Response } from "express";
import { error, ok } from "../../common/http";

const app = express();
const PORT = Number(process.env.PORT) || 4002;

const restaurants = [
  {
    id: 1,
    name: "Bella Pasta",
    description: "Итальянская кухня и домашняя паста",
    address: "ул. Ленина, 10",
    city: "Санкт-Петербург",
    price_category: "medium",
    cuisines: ["Итальянская"]
  },
  {
    id: 2,
    name: "Sakura",
    description: "Японская кухня, суши и рамен",
    address: "Невский проспект, 25",
    city: "Санкт-Петербург",
    price_category: "high",
    cuisines: ["Японская"]
  }
];

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => ok(res, { service: "restaurants", status: "ok" }));

app.get("/restaurants", (req: Request, res: Response) => {
  const { city, cuisine, price_category } = req.query;
  return ok(
    res,
    restaurants.filter(
      (item) =>
        (!city || item.city.toLowerCase() === String(city).toLowerCase()) &&
        (!cuisine || item.cuisines.includes(String(cuisine))) &&
        (!price_category || item.price_category === price_category)
    )
  );
});

app.get("/restaurants/:id", (req: Request, res: Response) => {
  const restaurant = restaurants.find((item) => item.id === Number(req.params.id));
  return restaurant ? ok(res, restaurant) : error(res, 404, "Ресторан не найден");
});

app.get("/internal/restaurants/:id", (req: Request, res: Response) => {
  const restaurant = restaurants.find((item) => item.id === Number(req.params.id));
  return restaurant ? ok(res, restaurant) : error(res, 404, "Ресторан не найден");
});

app.listen(PORT, () => console.log(`Restaurant Service started on ${PORT}`));
