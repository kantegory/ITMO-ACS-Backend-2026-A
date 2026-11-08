import { badRequest } from './errors';

export type Pagination = {
    page: number;
    size: number;
};

const parsePositiveInt = (value: unknown, field: string, fallback: number): number => {
    if (value === undefined) {
        return fallback;
    }

    const parsed = Number.parseInt(String(value), 10);

    if (Number.isNaN(parsed) || parsed < 1) {
        throw badRequest(`${field} must be a positive integer`);
    }

    return parsed;
};

export const parsePagination = (query: Record<string, unknown>): Pagination => {
    const page = parsePositiveInt(query.page, 'page', 1);
    const size = parsePositiveInt(query.size, 'size', 10);

    if (size > 100) {
        throw badRequest('size must be less than or equal to 100');
    }

    return { page, size };
};

export const parseId = (value: unknown, field: string): number => {
    const parsed = Number.parseInt(String(value), 10);

    if (Number.isNaN(parsed) || parsed < 1) {
        throw badRequest(`${field} must be a positive integer`);
    }

    return parsed;
};

export const paginated = <T>(items: T[], page: number, size: number, totalItems: number) => ({
    items,
    page,
    size,
    totalItems,
    totalPages: Math.ceil(totalItems / size),
});
