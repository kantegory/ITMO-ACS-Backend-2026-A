import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppDataSource } from "../data-source";
import { UserProgress } from "../entity/UserProgress";

export class ProgressController {
  static async getProgress(req: AuthRequest, res: Response) {
    const { start_date, end_date } = req.query;
    const progressRepo = AppDataSource.getRepository(UserProgress);

    let query = progressRepo
      .createQueryBuilder("p")
      .where("p.user_id = :userId", { userId: req.user!.id });

    if (start_date) {
      query = query.andWhere("p.date >= :start", { start: start_date });
    }
    if (end_date) {
      query = query.andWhere("p.date <= :end", { end: end_date });
    }

    const progress = await query.orderBy("p.date", "DESC").getMany();
    res.json(progress);
  }

  static async addProgress(req: AuthRequest, res: Response) {
    const { date, height_cm, weight_kg, muscle_mass_kg } = req.body;

    if (!date || !weight_kg) {
      res
        .status(400)
        .json({
          error: "Bad Request",
          message: "Date and weight_kg required",
          status_code: 400,
        });
      return;
    }

    const progressRepo = AppDataSource.getRepository(UserProgress);
    const progress = progressRepo.create({
      user_id: req.user!.id,
      date: new Date(date),
      height_cm,
      weight_kg,
      muscle_mass_kg,
    });

    await progressRepo.save(progress);
    res.status(201).json(progress);
  }

  static async getStats(req: AuthRequest, res: Response) {
    const { period = "month" } = req.query;
    const progressRepo = AppDataSource.getRepository(UserProgress);

    const now = new Date();
    let startDate: Date;

    if (period === "week") {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (period === "year") {
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
    } else {
      startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const progress = await progressRepo.find({
      where: { user_id: req.user!.id },
      order: { date: "ASC" },
    });

    const filtered = progress.filter((p) => new Date(p.date) >= startDate);

    const measurements = filtered.map((p) => ({
      date: p.date.toISOString().split("T")[0],
      weight_kg: p.weight_kg,
      muscle_mass_kg: p.muscle_mass_kg,
    }));

    const first = filtered[0];
    const last = filtered[filtered.length - 1];

    res.json({
      weight_change: first && last ? last.weight_kg - first.weight_kg : 0,
      muscle_change:
        first && last && last.muscle_mass_kg && first.muscle_mass_kg
          ? last.muscle_mass_kg - first.muscle_mass_kg
          : 0,
      start_date: startDate.toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      measurements,
    });
  }
}
