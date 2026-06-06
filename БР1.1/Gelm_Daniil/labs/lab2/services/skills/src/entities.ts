import { EntitySchema } from "typeorm";
import type { Skill } from "../../../shared/types.js";

export const SkillEntity = new EntitySchema<Skill>({
  name: "Skill",
  tableName: "skills",
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, unique: true },
  },
});
