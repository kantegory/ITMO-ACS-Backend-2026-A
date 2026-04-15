export function successResponse(data: unknown, message?: string) {
    return {
        data,
        ...(message ? { message } : {}),
    };
}

export function paginatedResponse(
    data: unknown,
    total: number,
    offset: number,
    limit: number,
) {
    return {
        data,
        pagination: {
            total,
            offset,
            limit,
            has_more: offset + limit < total,
        },
    };
}
