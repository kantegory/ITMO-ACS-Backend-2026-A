export const parsePagination = (q: any) => {
  const page = Math.max(0, parseInt(q.page ?? "0", 10) || 0);
  const size = Math.min(100, Math.max(1, parseInt(q.size ?? "20", 10) || 20));
  return { page, size, skip: page * size };
};

export const buildPageResponse = <T>(content: T[], total: number, page: number, size: number) => ({
  content,
  page,
  size,
  total_elements: total,
  total_pages: Math.ceil(total / size) || 0,
});
