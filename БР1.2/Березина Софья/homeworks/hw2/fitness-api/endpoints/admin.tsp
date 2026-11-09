import "../models/index.tsp";

using TypeSpec.Http;

namespace FitnessApi {

  @tag("Admin Workouts")
  interface AdminWorkouts {

    @post
    @route("/admin/workouts")
    createWorkout(@body request: CreateWorkoutRequest): Workout;

    @put
    @route("/admin/workouts/{workout_id}")
    updateWorkout(
      @path workout_id: string,
      @body request: UpdateWorkoutRequest,
    ): Workout;

    @delete
    @route("/admin/workouts/{workout_id}")
    deleteWorkout(@path workout_id: string): void;
  }

  @tag("Admin Exercises")
  interface AdminExercises {

    @post
    @route("/admin/exercises")
    createExercise(@body request: CreateExerciseRequest): Exercise;

    @put
    @route("/admin/exercises/{exercise_id}")
    updateExercise(
      @path exercise_id: string,
      @body request: CreateExerciseRequest,
    ): Exercise;

    @delete
    @route("/admin/exercises/{exercise_id}")
    deleteExercise(@path exercise_id: string): void;
  }

  @tag("Admin Blog")
  interface AdminBlog {

    @post
    @route("/admin/blog/posts")
    createPost(@body request: CreateBlogPostRequest): BlogPost;

    @put
    @route("/admin/blog/posts/{post_id}")
    updatePost(
      @path post_id: string,
      @body request: CreateBlogPostRequest,
    ): BlogPost;

    @delete
    @route("/admin/blog/posts/{post_id}")
    deletePost(@path post_id: string): void;
  }

}