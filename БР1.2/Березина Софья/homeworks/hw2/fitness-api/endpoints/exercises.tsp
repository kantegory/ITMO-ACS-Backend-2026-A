import "../models/index.tsp";

using TypeSpec.Http;

namespace FitnessApi {

  @tag("Exercises")
  interface Exercises {

    @get
    @route("/exercises")
    getExercises(): Exercise[];

    @get
    @route("/exercises/{exercise_id}")
    getExerciseById(@path exercise_id: string): {
      exercise: Exercise;
    };
  }

}
