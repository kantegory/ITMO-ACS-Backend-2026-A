import { EntitySchema } from "typeorm";
import type { Vacancy } from "../../../shared/types.js";

export const VacancyEntity = new EntitySchema<Vacancy>({
  name: "Vacancy",
  tableName: "vacancies",
  columns: {
    id: { type: Number, primary: true, generated: true },
    companyId: { type: Number, name: "company_id" },
    title: { type: String },
    description: { type: String, nullable: true },
    salaryFrom: { type: Number, name: "salary_from", nullable: true },
    salaryTo: { type: Number, name: "salary_to", nullable: true },
    experienceRequired: { type: Number, name: "experience_required", nullable: true },
    employmentType: { type: String, name: "employment_type", default: "full_time" },
    location: { type: String, nullable: true },
    createdAt: { type: "timestamp", name: "created_at", createDate: true },
    updatedAt: { type: "timestamp", name: "updated_at", updateDate: true },
  },
});
