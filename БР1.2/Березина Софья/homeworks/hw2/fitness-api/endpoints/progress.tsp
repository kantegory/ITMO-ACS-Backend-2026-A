import "../models/index.tsp";

using TypeSpec.Http;

namespace FitnessApi {

  @tag("Progress")
  interface Progress {

    @get
    @route("/progress")
    getProgress(
      @query start_date?: string,
      @query end_date?: string,
    ): UserProgress[];

    @post
    @route("/progress")
    addProgress(@body request: CreateProgressRequest): UserProgress;

    @get
    @route("/progress/stats")
    getStats(@query period?: "week" | "month" | "year"): ProgressStats;
  }
}