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
      @body request: CreateWorkoutRequest,
    ): Workout;

    @delete
    @route("/admin/workouts/{workout_id}")
    deleteWorkout(@path workout_id: string): void;
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