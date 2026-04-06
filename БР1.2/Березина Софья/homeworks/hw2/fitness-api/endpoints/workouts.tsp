import "../models/index.tsp";

using TypeSpec.Http;

namespace FitnessApi {

  @tag("Workouts")
  interface Workouts {

    @get
    @route("/workouts")
    getWorkouts(...WorkoutFilterParams): Workout[];

    @get
    @route("/workouts/{workout_id}")
    getWorkoutById(@path workout_id: string): {
      workout: Workout;
    };

    @get
    @route("/workouts/{workout_id}/exercises")
    getWorkoutExercises(@path workout_id: string): Exercise[];
  }

}