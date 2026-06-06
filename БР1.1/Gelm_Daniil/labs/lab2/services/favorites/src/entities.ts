import { EntitySchema } from "typeorm";
import type { FavoriteVacancy } from "../../../shared/types.js";

export const FavoriteVacancyEntity = new EntitySchema<FavoriteVacancy>({
  name: "FavoriteVacancy",
  tableName: "favorite_vacancies",
  columns: {
    userId: { type: Number, name: "user_id", primary: true },
    vacancyId: { type: Number, name: "vacancy_id", primary: true },
    createdAt: { type: "timestamp", name: "created_at", createDate: true },
  },
});
