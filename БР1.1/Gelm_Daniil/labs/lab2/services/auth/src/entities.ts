import { EntitySchema } from "typeorm";
import type { User } from "../../../shared/types.js";

export const UserEntity = new EntitySchema<User>({
  name: "User",
  tableName: "users",
  columns: {
    id: { type: Number, primary: true, generated: true },
    email: { type: String, unique: true },
    passwordHash: { type: String, name: "password_hash" },
    firstName: { type: String, name: "first_name" },
    lastName: { type: String, name: "last_name" },
    role: { type: String },
    createdAt: { type: "timestamp", name: "created_at", createDate: true },
    updatedAt: { type: "timestamp", name: "updated_at", updateDate: true },
  },
});

export function toPublicUser(user: User) {
  const { passwordHash: _, ...rest } = user;
  return rest;
}
