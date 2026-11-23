import { t, type TSchema } from "elysia";

export const ApiError = t.Object({
  code: t.String(),
  message: t.String(),
  details: t.Optional(t.Unknown()),
});

export const ApplicationStatus = t.Union([
  t.Literal("new"),
  t.Literal("viewed"),
  t.Literal("rejected"),
  t.Literal("invited"),
]);

export const ApplicationDto = t.Object({
  id: t.Number(),
  vacancyId: t.Number(),
  userId: t.Number(),
  resumeId: t.Number(),
  status: ApplicationStatus,
  createdAt: t.Date(),
});

export const paginated = <S extends TSchema>(itemSchema: S) =>
  t.Object({
    items: t.Array(itemSchema),
    total: t.Number(),
    page: t.Number(),
    pageSize: t.Number(),
  });
