const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "User",
  tableName: "users",
  columns: {
    id: { type: String, primary: true },
    email: { type: String, unique: true },
    displayName: { name: "display_name", type: String },
    role: { type: String, default: "user" },
    age: { type: Number, nullable: true },
    heightCm: {
      name: "height_cm",
      type: "numeric",
      precision: 6,
      scale: 2,
      nullable: true,
    },
    createdAt: { name: "created_at", type: "timestamptz", createDate: true },
    updatedAt: { name: "updated_at", type: "timestamptz", updateDate: true },
  },
});
