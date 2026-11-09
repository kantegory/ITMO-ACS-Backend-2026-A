import { Elysia, t } from "elysia";
import { ApiError } from "../schemas";
import { db } from "../db/client";
import { apiError, assertInternal } from "../lib/errors";

export const internalRoutes = new Elysia({ name: "jobseeker-internal" }).get(
  "/internal/resumes/:resumeId",
  async ({ params, query, headers, set }) => {
    if (!assertInternal(headers as Record<string, string | undefined>)) {
      set.status = 401;
      return apiError("UNAUTHORIZED", "Неверный internal secret");
    }
    const ownerUserId = Number(query.ownerUserId);
    if (!Number.isInteger(ownerUserId)) {
      set.status = 400;
      return apiError("VALIDATION_ERROR", "ownerUserId обязателен");
    }
    const resume = await db.resume.findUnique({ where: { id: params.resumeId } });
    if (!resume) {
      set.status = 404;
      return apiError("NOT_FOUND", "Резюме не найдено");
    }
    if (resume.userId !== ownerUserId) {
      set.status = 403;
      return apiError("FORBIDDEN", "Резюме принадлежит другому пользователю");
    }
    return { id: resume.id, userId: resume.userId };
  },
  {
    params: t.Object({ resumeId: t.Numeric() }),
    query: t.Object({ ownerUserId: t.Numeric() }),
    response: {
      200: t.Object({ id: t.Number(), userId: t.Number() }),
      400: ApiError,
      401: ApiError,
      403: ApiError,
      404: ApiError,
    },
  }
);
