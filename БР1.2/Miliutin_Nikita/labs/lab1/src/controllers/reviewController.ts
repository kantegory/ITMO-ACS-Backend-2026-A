import { Request, Response } from "express";
import { nextId, restaurants, reviews } from "../data/store";
import { AuthenticatedRequest } from "../middleware/auth";
import { created, error, ok } from "../views/apiView";

export const listReviews = (req: Request, res: Response): Response => {
  const restaurantId = Number(req.params.id);

  if (!restaurants.some((restaurant) => restaurant.restaurant_id === restaurantId)) {
    return error(res, 404, "Ресторан не найден");
  }

  return ok(res, reviews.filter((review) => review.restaurant_id === restaurantId));
};

export const createReview = (req: AuthenticatedRequest, res: Response): Response => {
  const restaurantId = Number(req.params.id);
  const { rating, comment } = req.body;

  if (!req.user) {
    return error(res, 401, "Пользователь не авторизован");
  }

  if (!restaurants.some((restaurant) => restaurant.restaurant_id === restaurantId)) {
    return error(res, 404, "Ресторан не найден");
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return error(res, 400, "Оценка должна быть целым числом от 1 до 5");
  }

  const review = {
    review_id: nextId(reviews, "review_id"),
    user_id: req.user.user_id,
    restaurant_id: restaurantId,
    rating,
    comment: comment || "",
    created_at: new Date().toISOString()
  };

  reviews.push(review);
  return created(res, {
    message: "Отзыв добавлен",
    review
  });
};
