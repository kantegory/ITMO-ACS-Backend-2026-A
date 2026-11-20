import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppDataSource } from "../data-source";
import { Workout, WorkoutType, DifficultyLevel } from "../entity/Workout";
import { Exercise } from "../entity/Exercise";
import { BlogPost, BlogCategory } from "../entity/BlogPost";

export class AdminController {
  // Workouts
  static async createWorkout(req: AuthRequest, res: Response) {
    const {
      title,
      type,
      difficulty_level,
      description,
      duration_min,
      video_url,
      instructions,
      exercises,
    } = req.body;

    const workoutRepo = AppDataSource.getRepository(Workout);
    const workout = workoutRepo.create({
      title,
      type,
      difficulty_level,
      description,
      duration_min,
      video_url,
      instructions,
      created_by: req.user!.id,
      is_published: true,
    });

    if (exercises && exercises.length > 0) {
      const exerciseRepo = AppDataSource.getRepository(Exercise);
      const exerciseEntities = await exerciseRepo.findByIds(
        exercises.map((e: any) => e.id),
      );
      workout.exercises = exerciseEntities;
    }

    await workoutRepo.save(workout);
    res.status(201).json(workout);
  }

  static async updateWorkout(req: AuthRequest, res: Response) {
    const { workout_id } = req.params;
    const {
      title,
      type,
      difficulty_level,
      description,
      duration_min,
      video_url,
      instructions,
      exercise_ids,
    } = req.body;

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

    if (title !== undefined) workout.title = title;
    if (type !== undefined) workout.type = type;
    if (difficulty_level !== undefined)
      workout.difficulty_level = difficulty_level;
    if (description !== undefined) workout.description = description;
    if (duration_min !== undefined) workout.duration_min = duration_min;
    if (video_url !== undefined) workout.video_url = video_url;
    if (instructions !== undefined) workout.instructions = instructions;

    if (exercise_ids && exercise_ids.length > 0) {
      const exerciseRepo = AppDataSource.getRepository(Exercise);
      const exercises = await exerciseRepo.findByIds(exercise_ids);
      workout.exercises = exercises;
    }

    await workoutRepo.save(workout);
    res.json(workout);
  }

  static async deleteWorkout(req: AuthRequest, res: Response) {
    const { workout_id } = req.params;
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

    await workoutRepo.remove(workout);
    res.status(204).send();
  }

  // Exercises
  static async createExercise(req: AuthRequest, res: Response) {
    const {
      title,
      description,
      target_muscle_group,
      equipment,
      instructions,
      video_url,
    } = req.body;

    const exerciseRepo = AppDataSource.getRepository(Exercise);
    const exercise = exerciseRepo.create({
      title,
      description,
      target_muscle_group,
      equipment,
      instructions,
      video_url,
    });

    await exerciseRepo.save(exercise);
    res.status(201).json(exercise);
  }

  static async updateExercise(req: AuthRequest, res: Response) {
    const { exercise_id } = req.params;
    const {
      title,
      description,
      target_muscle_group,
      equipment,
      instructions,
      video_url,
    } = req.body;

    const exerciseRepo = AppDataSource.getRepository(Exercise);
    const exercise = await exerciseRepo.findOneBy({ id: exercise_id });

    if (!exercise) {
      res
        .status(404)
        .json({
          error: "Not Found",
          message: "Exercise not found",
          status_code: 404,
        });
      return;
    }

    if (title !== undefined) exercise.title = title;
    if (description !== undefined) exercise.description = description;
    if (target_muscle_group !== undefined)
      exercise.target_muscle_group = target_muscle_group;
    if (equipment !== undefined) exercise.equipment = equipment;
    if (instructions !== undefined) exercise.instructions = instructions;
    if (video_url !== undefined) exercise.video_url = video_url;

    await exerciseRepo.save(exercise);
    res.json(exercise);
  }

  static async deleteExercise(req: AuthRequest, res: Response) {
    const { exercise_id } = req.params;
    const exerciseRepo = AppDataSource.getRepository(Exercise);
    const exercise = await exerciseRepo.findOneBy({ id: exercise_id });

    if (!exercise) {
      res
        .status(404)
        .json({
          error: "Not Found",
          message: "Exercise not found",
          status_code: 404,
        });
      return;
    }

    await exerciseRepo.remove(exercise);
    res.status(204).send();
  }

  // Blog posts
  static async createBlogPost(req: AuthRequest, res: Response) {
    const { title, content, featured_image, category } = req.body;

    const blogRepo = AppDataSource.getRepository(BlogPost);
    const post = blogRepo.create({
      title,
      content,
      featured_image,
      category,
      author_id: req.user!.id,
    });

    await blogRepo.save(post);
    res.status(201).json(post);
  }

  static async updateBlogPost(req: AuthRequest, res: Response) {
    const { post_id } = req.params;
    const { title, content, featured_image, category } = req.body;

    const blogRepo = AppDataSource.getRepository(BlogPost);
    const post = await blogRepo.findOneBy({ id: post_id });

    if (!post) {
      res
        .status(404)
        .json({
          error: "Not Found",
          message: "Post not found",
          status_code: 404,
        });
      return;
    }

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (featured_image !== undefined) post.featured_image = featured_image;
    if (category !== undefined) post.category = category;

    await blogRepo.save(post);
    res.json(post);
  }

  static async deleteBlogPost(req: AuthRequest, res: Response) {
    const { post_id } = req.params;
    const blogRepo = AppDataSource.getRepository(BlogPost);
    const post = await blogRepo.findOneBy({ id: post_id });

    if (!post) {
      res
        .status(404)
        .json({
          error: "Not Found",
          message: "Post not found",
          status_code: 404,
        });
      return;
    }

    await blogRepo.remove(post);
    res.status(204).send();
  }
}
