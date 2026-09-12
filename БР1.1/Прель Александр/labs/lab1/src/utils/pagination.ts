import { badRequest } from "../errors";

export type Pagination = {
  page: number;
  limit: number;
};

export const getPagination = (query: Record<string, unknown>): Pagination => {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 10 : Number(query.limit);

  if (!Number.isInteger(page) || page < 1) {
    throw badRequest("Некорректный номер страницы.");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw badRequest("Некорректный размер страницы.");
  }

  return { page, limit };
};

export const paginate = <T>(items: T[], page: number, limit: number) => {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / limit);
  const start = (page - 1) * limit;

  return {
    items: items.slice(start, start + limit),
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
    },
  };
};
