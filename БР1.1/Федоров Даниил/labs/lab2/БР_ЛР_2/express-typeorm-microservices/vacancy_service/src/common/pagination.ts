export const getPagination = (
    page?: number | string,
    perPage?: number | string,
) => {
    const safePage = Math.max(Number(page) || 1, 1);
    const safePerPage = Math.min(Math.max(Number(perPage) || 10, 1), 100);

    return {
        page: safePage,
        perPage: safePerPage,
        skip: (safePage - 1) * safePerPage,
    };
};

export const buildPaginationMeta = (
    page: number,
    perPage: number,
    total: number,
) => {
    return {
        page: page,
        per_page: perPage,
        total: total,
        total_pages: Math.max(Math.ceil(total / perPage), 1),
    };
};

