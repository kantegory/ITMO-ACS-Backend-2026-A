const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Workout",
  tableName: "workouts",
  columns: {
    id: { type: String, primary: true },
    title: { type: String },
    type: { type: String },
    difficultyLevel: { name: "difficulty_level", type: String },
    description: { type: String, nullable: true },
    durationMin: { name: "duration_min", type: Number },
    createdBy: { name: "created_by", type: String, nullable: true },
    isPublished: { name: "is_published", type: Boolean, default: true },
    createdAt: { name: "created_at", type: "timestamptz", createDate: true },
  },
});
