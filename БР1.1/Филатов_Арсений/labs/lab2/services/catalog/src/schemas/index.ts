import { t, type TSchema } from "elysia";

export const ApiError = t.Object({
  code: t.String(),
  message: t.String(),
  details: t.Optional(t.Unknown()),
});

export const IndustryDto = t.Object({
  id: t.Number(),
  name: t.String(),
});

export const ExperienceLevelDto = t.Object({
  id: t.Number(),
  code: t.String(),
  name: t.String(),
  sortOrder: t.Number(),
});

export const SkillDto = t.Object({
  id: t.Number(),
  name: t.String(),
});

export const paginated = <S extends TSchema>(itemSchema: S) =>
  t.Object({
    items: t.Array(itemSchema),
    total: t.Number(),
    page: t.Number(),
    pageSize: t.Number(),
  });
