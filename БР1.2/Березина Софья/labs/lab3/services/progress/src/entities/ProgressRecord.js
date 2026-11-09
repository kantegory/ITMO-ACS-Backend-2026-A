const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ProgressRecord",
  tableName: "progress_records",
  columns: {
    id: { type: String, primary: true },
    userId: { name: "user_id", type: String },
    userWorkoutId: { name: "user_workout_id", type: String, nullable: true },
    workoutId: { name: "workout_id", type: String, nullable: true },
    date: { type: "date", default: () => "CURRENT_DATE" },
    weightKg: {
      name: "weight_kg",
      type: "numeric",
      precision: 6,
      scale: 2,
      nullable: true,
    },
    heightCm: {
      name: "height_cm",
      type: "numeric",
      precision: 6,
      scale: 2,
      nullable: true,
    },
    muscleMassKg: {
      name: "muscle_mass_kg",
      type: "numeric",
      precision: 6,
      scale: 2,
      nullable: true,
    },
    rating: { type: Number, nullable: true },
    completedExercisesCount: {
      name: "completed_exercises_count",
      type: Number,
      nullable: true,
    },
    sourceEventId: {
      name: "source_event_id",
      type: String,
      unique: true,
      nullable: true,
    },
    createdAt: { name: "created_at", type: "timestamptz", createDate: true },
  },
});
