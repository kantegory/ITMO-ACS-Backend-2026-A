export interface PageParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export const getPageParams = (query: { page?: unknown; limit?: unknown }): PageParams => {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '20'), 10) || 20));
  return { page, limit, skip: (page - 1) * limit, take: limit };
};

export const buildMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  total_pages: Math.ceil(total / limit) || 0,
});
