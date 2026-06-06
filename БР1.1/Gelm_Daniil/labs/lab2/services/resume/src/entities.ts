import { EntitySchema } from "typeorm";
import type { Resume } from "../../../shared/types.js";

export const ResumeEntity = new EntitySchema<Resume>({
  name: "Resume",
  tableName: "resumes",
  columns: {
    id: { type: Number, primary: true, generated: true },
    userId: { type: Number, name: "user_id" },
    title: { type: String },
    about: { type: String, nullable: true },
    experienceYears: { type: Number, name: "experience_years", default: 0 },
    education: { type: String, nullable: true },
    desiredSalary: { type: Number, name: "desired_salary", nullable: true },
    createdAt: { type: "timestamp", name: "created_at", createDate: true },
    updatedAt: { type: "timestamp", name: "updated_at", updateDate: true },
  },
});
