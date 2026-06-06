import { EntitySchema } from "typeorm";
import type { Application } from "../../../shared/types.js";

export const ApplicationEntity = new EntitySchema<Application>({
  name: "Application",
  tableName: "applications",
  columns: {
    id: { type: Number, primary: true, generated: true },
    vacancyId: { type: Number, name: "vacancy_id" },
    resumeId: { type: Number, name: "resume_id" },
    status: { type: String, default: "sent" },
    coverLetter: { type: String, name: "cover_letter", nullable: true },
    createdAt: { type: "timestamp", name: "created_at", createDate: true },
  },
});
