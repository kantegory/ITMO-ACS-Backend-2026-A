import "../models/index.tsp";

using TypeSpec.Http;

namespace FitnessApi {

  @tag("User Workouts")
  interface UserWorkouts {
    @get
    @route("/user/workouts")
    getUserWorkouts(@query status?: UserWorkoutStatus): UserWorkout[];

    @post
    @route("/user/workouts")
    assignWorkout(@body request: AssignWorkoutRequest): UserWorkout;

    @patch
    @route("/user/workouts/{user_workout_id}")
    updateUserWorkout(
      @path user_workout_id: int32,
      @body request: UpdateUserWorkoutRequest,
    ): UserWorkout;
  }
}