const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "AuthAccount",
  tableName: "auth_accounts",
  columns: {
    id: { type: String, primary: true },
    email: { type: String, unique: true },
    passwordHash: { name: "password_hash", type: String },
    role: { type: String, default: "user" },
    createdAt: { name: "created_at", type: "timestamptz", createDate: true },
  },
});
