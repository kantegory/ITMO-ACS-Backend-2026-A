import "@typespec/http";
import "./common.tsp";

using TypeSpec.Http;

namespace FitnessApi {

  model Exercise {
    id: string;
    title: string;
    description?: string;
    target_muscle_group?: string;
    equipment?: string;
    instructions?: string;
    video_url?: string;
  }

  model CreateExerciseRequest {
    title: string;
    description?: string;
    target_muscle_group?: string;
    equipment?: string;
    instructions?: string;
    video_url?: string;
  }

  enum WorkoutType {
    cardio: "cardio",
    strength: "strength",
    hiit: "hiit",
    yoga: "yoga",
    pilates: "pilates",
    stretching: "stretching",
  }

  enum DifficultyLevel {
    beginner: "beginner",
    intermediate: "intermediate",
    advanced: "advanced",
  }

  model Workout {
    id: string;
    title: string;
    type: WorkoutType;
    difficulty_level: DifficultyLevel;
    description?: string;
    duration_min: int32;
    video_url?: string;
    instructions?: string;
    exercises?: Exercise[];
    created_by: string;
    @format("date-time")
    created_at: string;
  }

  enum UserWorkoutStatus {
    scheduled: "scheduled",
    in_progress: "in_progress",
    completed: "completed",
    skipped: "skipped",
  }

  model UserWorkout {
    id: int32;
    user_id: string;
    workout_id: string;
    status: UserWorkoutStatus;
    @format("date")
    scheduled_date?: string;
    @format("date")
    completed_date?: string;
    rating?: int32;
    result?: WorkoutResult;
  }

  model WorkoutResult {
    duration_min?: int32;
    completed_exercises_count?: int32;
    notes?: string;
  }

  model CreateWorkoutRequest {
    title: string;
    type: WorkoutType;
    difficulty_level: DifficultyLevel;
    description?: string;
    duration_min: int32;
    video_url?: string;
    instructions?: string;
    exercises?: Exercise[];
  }

  model UpdateWorkoutRequest {
    title?: string;
    type?: WorkoutType;
    difficulty_level?: DifficultyLevel;
    description?: string;
    duration_min?: int32;
    video_url?: string;
    instructions?: string;
    exercise_ids?: string[];
  }

  model AssignWorkoutRequest {
    workout_id: string;
    @format("date")
    scheduled_date?: string;
  }

  model UpdateUserWorkoutRequest {
    status?: UserWorkoutStatus;
    rating?: int32;
    result?: WorkoutResult;
  }

  model WorkoutFilterParams {
    @query
    type?: WorkoutType;
    @query
    difficulty_level?: DifficultyLevel;
    @query
    duration_min_min?: int32;
    @query
    duration_min_max?: int32;
  }

  model UserWorkoutFilterParams {
    @query
    status?: UserWorkoutStatus;
    @query
    @format("date")
    scheduled_from?: string;
    @query
    @format("date")
    scheduled_to?: string;
    @query
    @format("date")
    completed_from?: string;
    @query
    @format("date")
    completed_to?: string;
  }
}