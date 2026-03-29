import "@typespec/http";
import "./common.tsp";

using TypeSpec.Http;

namespace FitnessApi {

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
    scheduled_date?: string;
    @format("date-time")
    completed_date?: string;
    rating?: int32;
  }

  model CreateWorkoutRequest {
    title: string;
    type: WorkoutType;
    difficulty_level: DifficultyLevel;
    description?: string;
    duration_min: int32;
    video_url?: string;
    instructions?: string;
    exercises?: string[];
  }

  model AssignWorkoutRequest {
    workout_id: string;
    scheduled_date?: string;
  }

  model UpdateUserWorkoutRequest {
    status?: UserWorkoutStatus;
    rating?: int32;
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
}