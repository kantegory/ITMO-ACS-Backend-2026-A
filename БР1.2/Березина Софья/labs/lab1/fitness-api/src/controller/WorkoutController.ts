import { Response } from "express";
import { Request } from "express";
import { AppDataSource } from "../data-source";
import { Workout } from "../entity/Workout";

export class WorkoutController {
  static async getWorkouts(req: Request, res: Response) {
    const { type, difficulty_level, duration_min_min, duration_min_max } =
      req.query;
    const workoutRepo = AppDataSource.getRepository(Workout);

    let query = workoutRepo
      .createQueryBuilder("w")
      .leftJoinAndSelect("w.exercises", "e")
      .where("w.is_published = :published", { published: true });

    if (type) {
      query = query.andWhere("w.type = :type", { type });
    }
    if (difficulty_level) {
      query = query.andWhere("w.difficulty_level = :difficulty", {
        difficulty: difficulty_level,
      });
    }
    if (duration_min_min) {
      query = query.andWhere("w.duration_min >= :min", {
        min: Number(duration_min_min),
      });
    }
    if (duration_min_max) {
      query = query.andWhere("w.duration_min <= :max", {
        max: Number(duration_min_max),
      });
    }

    const workouts = await query.getMany();
    res.json(workouts);
  }

  static async getWorkoutById(req: Request, res: Response) {
    const { workout_id } = req.params;
    const workoutRepo = AppDataSource.getRepository(Workout);

    const workout = await workoutRepo.findOne({
      where: { id: workout_id },
      relations: ["exercises"],
    });

    if (!workout) {
      res
        .status(404)
        .json({
          error: "Not Found",
          message: "Workout not found",
          status_code: 404,
        });
      return;
    }

    res.json({ workout });
  }

  static async getWorkoutExercises(req: Request, res: Response) {
    const { workout_id } = req.params;
    const workoutRepo = AppDataSource.getRepository(Workout);

    const workout = await workoutRepo.findOne({
      where: { id: workout_id },
      relations: ["exercises"],
    });

    if (!workout) {
      res
        .status(404)
        .json({
          error: "Not Found",
          message: "Workout not found",
          status_code: 404,
        });
      return;
    }

    res.json(workout.exercises || []);
  }
}
