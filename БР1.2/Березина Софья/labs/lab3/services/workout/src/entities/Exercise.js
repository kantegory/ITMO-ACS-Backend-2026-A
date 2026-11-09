const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Exercise",
  tableName: "exercises",
  columns: {
    id: { type: String, primary: true },
    workoutId: { name: "workout_id", type: String },
    title: { type: String },
    targetMuscleGroup: {
      name: "target_muscle_group",
      type: String,
      nullable: true,
    },
    equipment: { type: String, nullable: true },
    sets: { type: Number, nullable: true },
    reps: { type: Number, nullable: true },
  },
});
