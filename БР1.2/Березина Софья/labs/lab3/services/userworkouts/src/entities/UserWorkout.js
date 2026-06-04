const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "UserWorkout",
  tableName: "user_workouts",
  columns: {
    id: { type: String, primary: true },
    userId: { name: "user_id", type: String },
    workoutId: { name: "workout_id", type: String },
    status: { type: String, default: "scheduled" },
    scheduledDate: { name: "scheduled_date", type: "date", nullable: true },
    completedAt: { name: "completed_at", type: "timestamptz", nullable: true },
    rating: { type: Number, nullable: true },
    resultNotes: { name: "result_notes", type: String, nullable: true },
    completedExercisesCount: {
      name: "completed_exercises_count",
      type: Number,
      nullable: true,
    },
    createdAt: { name: "created_at", type: "timestamptz", createDate: true },
  },
});
