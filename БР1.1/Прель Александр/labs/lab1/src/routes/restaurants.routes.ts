import { Router } from "express";
import { AppDataSource } from "../data-source";
import { MenuCategory, Restaurant, RestaurantPhoto, Review } from "../entities";
import { badRequest, notFound, ValidationErrorDetail } from "../errors";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/async-handler";
import { getPagination, paginate } from "../utils/pagination";
import {
  getAverageRating,
  toMenuCategoryResponse,
  toRestaurantDetailsResponse,
  toRestaurantPhotoResponse,
  toRestaurantShortResponse,
  toReviewResponse,
} from "../utils/serializers";
import { asPositiveInt, asString, ensureValid } from "../utils/validation";

export const restaurantsRouter = Router();

const priceWeight: Record<string, number> = {
  budget: 1,
  medium: 2,
  premium: 3,
};

const findRestaurant = async (restaurantId: number) => {
  const restaurant = await AppDataSource.getRepository(Restaurant).findOne({
    where: { restaurantId },
    relations: { cuisines: true, photos: true, reviews: true },
  });

  if (!restaurant) {
    throw notFound("Ресторан не найден.");
  }

  return restaurant;
};

restaurantsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit } = getPagination(req.query);
    const name = asString(req.query.name)?.toLowerCase();
    const city = asString(req.query.city)?.toLowerCase();
    const cuisineId = req.query.cuisine_id === undefined ? undefined : asPositiveInt(req.query.cuisine_id);
    const priceCategory = asString(req.query.price_category);
    const sortBy = asString(req.query.sort_by);
    const sortOrder = asString(req.query.sort_order) ?? "desc";

    if (req.query.cuisine_id !== undefined && !cuisineId) {
      throw badRequest("Некорректный идентификатор кухни.");
    }
    if (priceCategory && !["budget", "medium", "premium"].includes(priceCategory)) {
      throw badRequest("Некорректная ценовая категория.");
    }
    if (sortBy && !["price_category", "rating"].includes(sortBy)) {
      throw badRequest("Некорректное поле сортировки.");
    }
    if (!["asc", "desc"].includes(sortOrder)) {
      throw badRequest("Некорректное направление сортировки.");
    }

    const restaurants = await AppDataSource.getRepository(Restaurant).find({
      relations: { cuisines: true, photos: true, reviews: true },
    });

    const filtered = restaurants.filter((restaurant) => {
      const matchesName = !name || restaurant.name.toLowerCase().includes(name);
      const matchesCity = !city || restaurant.city.toLowerCase() === city;
      const matchesCuisine =
        !cuisineId || restaurant.cuisines.some((cuisine) => cuisine.cuisineId === cuisineId);
      const matchesPrice = !priceCategory || restaurant.priceCategory === priceCategory;
      return matchesName && matchesCity && matchesCuisine && matchesPrice;
    });

    const sorted = [...filtered].sort((left, right) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "price_category") {
        return (priceWeight[left.priceCategory] - priceWeight[right.priceCategory]) * multiplier;
      }
      if (sortBy === "rating") {
        return ((getAverageRating(left) ?? 0) - (getAverageRating(right) ?? 0)) * multiplier;
      }
      return left.restaurantId - right.restaurantId;
    });

    const result = paginate(sorted.map(toRestaurantShortResponse), page, limit);
    res.json(result);
  }),
);

restaurantsRouter.get(
  "/:restaurantId",
  asyncHandler(async (req, res) => {
    const restaurantId = asPositiveInt(req.params.restaurantId);
    if (!restaurantId) {
      throw badRequest("Некорректный идентификатор ресторана.");
    }

    const restaurant = await findRestaurant(restaurantId);
    res.json(toRestaurantDetailsResponse(restaurant));
  }),
);

restaurantsRouter.get(
  "/:restaurantId/menu",
  asyncHandler(async (req, res) => {
    const restaurantId = asPositiveInt(req.params.restaurantId);
    if (!restaurantId) {
      throw badRequest("Некорректный идентификатор ресторана.");
    }

    const restaurant = await findRestaurant(restaurantId);
    const categories = await AppDataSource.getRepository(MenuCategory).find({
      where: { restaurant: { restaurantId } },
      relations: { restaurant: true, items: true },
      order: { categoryId: "ASC" },
    });

    res.json({
      restaurantId: restaurant.restaurantId,
      categories: categories.map(toMenuCategoryResponse),
    });
  }),
);

restaurantsRouter.get(
  "/:restaurantId/reviews",
  asyncHandler(async (req, res) => {
    const restaurantId = asPositiveInt(req.params.restaurantId);
    if (!restaurantId) {
      throw badRequest("Некорректный идентификатор ресторана.");
    }

    const { page, limit } = getPagination(req.query);
    await findRestaurant(restaurantId);

    const reviews = await AppDataSource.getRepository(Review).find({
      where: { restaurant: { restaurantId } },
      relations: { user: true, restaurant: true },
      order: { createdAt: "DESC" },
    });

    res.json(paginate(reviews.map(toReviewResponse), page, limit));
  }),
);

restaurantsRouter.post(
  "/:restaurantId/reviews",
  requireAuth,
  asyncHandler(async (req, res) => {
    const restaurantId = asPositiveInt(req.params.restaurantId);
    if (!restaurantId) {
      throw badRequest("Некорректный идентификатор ресторана.");
    }

    const details: ValidationErrorDetail[] = [];
    const rating = asPositiveInt(req.body.rating);
    const comment = asString(req.body.comment);

    if (!rating || rating < 1 || rating > 5) {
      details.push({ field: "rating", message: "Оценка должна быть от 1 до 5." });
    }
    if (!comment) {
      details.push({ field: "comment", message: "Комментарий обязателен." });
    }
    ensureValid(details);

    const restaurant = await findRestaurant(restaurantId);
    const reviewRepository = AppDataSource.getRepository(Review);
    const review = await reviewRepository.save(
      reviewRepository.create({
        restaurant,
        user: req.user!,
        rating,
        comment,
      }),
    );

    res.status(201).json(toReviewResponse({ ...review, restaurant, user: req.user! }));
  }),
);

restaurantsRouter.get(
  "/:restaurantId/photos",
  asyncHandler(async (req, res) => {
    const restaurantId = asPositiveInt(req.params.restaurantId);
    if (!restaurantId) {
      throw badRequest("Некорректный идентификатор ресторана.");
    }

    const restaurant = await findRestaurant(restaurantId);
    const photos = await AppDataSource.getRepository(RestaurantPhoto).find({
      where: { restaurant: { restaurantId } },
      relations: { restaurant: true },
      order: { photoId: "ASC" },
    });

    res.json({
      restaurantId: restaurant.restaurantId,
      items: photos.map(toRestaurantPhotoResponse),
    });
  }),
);
