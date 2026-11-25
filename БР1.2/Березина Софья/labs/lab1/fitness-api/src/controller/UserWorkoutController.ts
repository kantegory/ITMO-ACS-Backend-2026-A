import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppDataSource } from "../data-source";
import { UserWorkout, UserWorkoutStatus } from "../entity/UserWorkout";
import { Workout } from "../entity/Workout";

export class UserWorkoutController {
  static async getUserWorkouts(req: AuthRequest, res: Response) {
    const { status, scheduled_from, scheduled_to } = req.query;
    const userWorkoutRepo = AppDataSource.getRepository(UserWorkout);

    let query = userWorkoutRepo
      .createQueryBuilder("uw")
      .leftJoinAndSelect("uw.workout", "w")
      .where("uw.user_id = :userId", { userId: req.user!.id });

    if (status) {
      query = query.andWhere("uw.status = :status", { status });
    }
    if (scheduled_from) {
      query = query.andWhere("uw.scheduled_date >= :from", {
        from: scheduled_from,
      });
    }
    if (scheduled_to) {
      query = query.andWhere("uw.scheduled_date <= :to", { to: scheduled_to });
    }

    const userWorkouts = await query
      .orderBy("uw.scheduled_date", "DESC")
      .getMany();
    res.json(userWorkouts);
  }

  static async assignWorkout(req: AuthRequest, res: Response) {
    const { workout_id, scheduled_date } = req.body;

    if (!workout_id) {
      res
        .status(400)
        .json({
          error: "Bad Request",
          message: "workout_id required",
          status_code: 400,
        });
      return;
    }

    const workoutRepo = AppDataSource.getRepository(Workout);
    const workout = await workoutRepo.findOneBy({ id: workout_id });

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

    const userWorkoutRepo = AppDataSource.getRepository(UserWorkout);
    const userWorkout = userWorkoutRepo.create({
      user_id: req.user!.id,
      workout_id,
      scheduled_date: scheduled_date ? new Date(scheduled_date) : undefined,
      status: UserWorkoutStatus.SCHEDULED,
    });

    await userWorkoutRepo.save(userWorkout);
    res.status(201).json(userWorkout);
  }

  static async updateUserWorkout(req: AuthRequest, res: Response) {
    const { user_workout_id } = req.params;
    const { status, rating, result } = req.body;

    const userWorkoutRepo = AppDataSource.getRepository(UserWorkout);
    const userWorkout = await userWorkoutRepo.findOne({
      where: { id: Number(user_workout_id), user_id: req.user!.id },
    });

    if (!userWorkout) {
      res
        .status(404)
        .json({
          error: "Not Found",
          message: "User workout not found",
          status_code: 404,
        });
      return;
    }

    if (status) {
      userWorkout.status = status;
      if (status === UserWorkoutStatus.COMPLETED) {
        userWorkout.completed_date = new Date();
      }
    }
    if (rating !== undefined) userWorkout.rating = rating;
    if (result) {
      if (result.completed_exercises_count !== undefined)
        userWorkout.completed_exercises_count =
          result.completed_exercises_count;
      if (result.notes !== undefined) userWorkout.result_notes = result.notes;
    }

    await userWorkoutRepo.save(userWorkout);
    res.json(userWorkout);
  }
}
