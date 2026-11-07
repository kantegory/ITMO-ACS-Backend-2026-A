export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface PageParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

/** Нормализует параметры постраничного вывода: page >= 1, 1 <= limit <= 100. */
export const parsePageParams = (query: { page?: unknown; limit?: unknown }): PageParams => {
  const rawPage = Number(query.page);
  const rawLimit = Number(query.limit);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 100) : 20;
  return { page, limit, skip: (page - 1) * limit, take: limit };
};

export const buildMeta = (total: number, params: PageParams): PageMeta => ({
  page: params.page,
  limit: params.limit,
  total,
  totalPages: Math.max(Math.ceil(total / params.limit), 1),
});

export const paginate = <T>(data: T[], total: number, params: PageParams): Paginated<T> => ({
  data,
  meta: buildMeta(total, params),
});
