import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Review } from "../entities/Review";
import { Restaurant } from "../entities/Restaurant";
import { AuthRequest } from "../middleware/authMiddleware";

export class ReviewController {
  static async list(req: Request, res: Response): Promise<Response> {
    try {
      const { restaurantId } = req.params;
      const { min_rating, page = "1", page_size = "20" } = req.query as Record<string, string>;

      const restaurantRepo = AppDataSource.getRepository(Restaurant);
      const restaurant = await restaurantRepo.findOneBy({ id: restaurantId });

      if (!restaurant) {
        return res.status(404).json({ error: { code: "not_found", message: "ресторан не найден" } });
      }

      const reviewRepo = AppDataSource.getRepository(Review);
      let query = reviewRepo
        .createQueryBuilder("review")
        .leftJoinAndSelect("review.user", "user")
        .where("review.restaurant_id = :restaurantId", { restaurantId });

      if (min_rating) {
        query = query.andWhere("review.rating >= :min_rating", { min_rating: Number(min_rating) });
      }

      const pageNum = Math.max(1, Number(page));
      const pageSizeNum = Math.min(100, Math.max(1, Number(page_size)));

      const total = await query.getCount();
      const reviews = await query
        .skip((pageNum - 1) * pageSizeNum)
        .take(pageSizeNum)
        .orderBy("review.created_at", "DESC")
        .getMany();

      const items = reviews.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        restaurant_id: r.restaurant_id,
        rating: r.rating,
        comment: r.comment,
        user: r.user
          ? { id: r.user.id, first_name: r.user.first_name, last_name: r.user.last_name }
          : null,
        created_at: r.created_at,
      }));

      return res.status(200).json({
        items,
        pagination: {
          page: pageNum,
          page_size: pageSizeNum,
          total_items: total,
          total_pages: Math.ceil(total / pageSizeNum),
        },
      });
    } catch (error) {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { restaurantId } = req.params;
      const { rating, comment } = req.body;

      if (!rating || !comment) {
        return res.status(400).json({
          error: { code: "bad_request", message: "оценка и комментарий обязательны" },
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(422).json({
          error: {
            code: "validation_error",
            message: "ошибка валидации входных данных",
            details: { rating: ["оценка должна быть от 1 до 5"] },
          },
        });
      }

      if (comment.length < 10 || comment.length > 1000) {
        return res.status(422).json({
          error: {
            code: "validation_error",
            message: "ошибка валидации входных данных",
            details: { comment: ["комментарий должен содержать от 10 до 1000 символов"] },
          },
        });
      }

      const restaurantRepo = AppDataSource.getRepository(Restaurant);
      const restaurant = await restaurantRepo.findOneBy({ id: restaurantId });

      if (!restaurant) {
        return res.status(404).json({ error: { code: "not_found", message: "ресторан не найден" } });
      }

      const reviewRepo = AppDataSource.getRepository(Review);
      const existing = await reviewRepo.findOne({
        where: { user_id: req.user!.id, restaurant_id: restaurantId },
      });

      if (existing) {
        return res.status(409).json({
          error: {
            code: "review_already_exists",
            message: "вы уже оставили отзыв для этого ресторана",
          },
        });
      }

      const review = reviewRepo.create({
        user_id: req.user!.id,
        restaurant_id: restaurantId,
        rating: Number(rating),
        comment,
      });

      await reviewRepo.save(review);

      // Update restaurant average rating
      const allReviews = await reviewRepo.findBy({ restaurant_id: restaurantId });
      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      restaurant.rating = Math.round(avgRating * 10) / 10;
      await restaurantRepo.save(restaurant);

      const saved = await reviewRepo.findOne({
        where: { id: review.id },
        relations: ["user"],
      });

      return res.status(201).json({
        id: saved!.id,
        user_id: saved!.user_id,
        restaurant_id: saved!.restaurant_id,
        rating: saved!.rating,
        comment: saved!.comment,
        user: saved!.user
          ? { id: saved!.user.id, first_name: saved!.user.first_name, last_name: saved!.user.last_name }
          : null,
        created_at: saved!.created_at,
      });
    } catch (error) {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  }
}
