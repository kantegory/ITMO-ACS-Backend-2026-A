import { EntitySchema } from "typeorm";
import type { Company } from "../../../shared/types.js";

export const CompanyEntity = new EntitySchema<Company>({
  name: "Company",
  tableName: "companies",
  columns: {
    id: { type: Number, primary: true, generated: true },
    ownerId: { type: Number, name: "owner_id" },
    name: { type: String },
    description: { type: String, nullable: true },
    website: { type: String, nullable: true },
    location: { type: String, nullable: true },
    createdAt: { type: "timestamp", name: "created_at", createDate: true },
  },
});
