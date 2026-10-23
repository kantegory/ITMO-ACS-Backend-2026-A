import cors from "cors";
import express, { Request, Response } from "express";
import { error, ok } from "../../common/http";
import { Restaurant } from "../../common/types";

const app = express();
const PORT = Number(process.env.RESTAURANT_PORT) || 4002;

const restaurants: Restaurant[] = [
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
  const filtered = restaurants.filter(
    (restaurant) =>
      (!city || restaurant.city.toLowerCase() === String(city).toLowerCase()) &&
      (!cuisine || restaurant.cuisines.includes(String(cuisine))) &&
      (!price_category || restaurant.price_category === price_category)
  );

  return ok(res, filtered);
});

app.get("/restaurants/:id", (req: Request, res: Response) => {
  const restaurant = restaurants.find((item) => item.id === Number(req.params.id));

  if (!restaurant) {
    return error(res, 404, "Ресторан не найден");
  }

  return ok(res, restaurant);
});

app.get("/internal/restaurants/:id", (req: Request, res: Response) => {
  const restaurant = restaurants.find((item) => item.id === Number(req.params.id));

  if (!restaurant) {
    return error(res, 404, "Ресторан не найден");
  }

  return ok(res, {
    id: restaurant.id,
    name: restaurant.name,
    city: restaurant.city,
    price_category: restaurant.price_category
  });
});

app.listen(PORT, () => console.log(`Restaurant Service started on http://localhost:${PORT}`));
