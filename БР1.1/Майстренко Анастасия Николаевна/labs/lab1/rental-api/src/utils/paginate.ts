import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export interface PageMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface Page<T> {
    items: T[];
    meta: PageMeta;
}

export function normalizePage(page?: number, limit?: number) {
    const p = Math.max(1, parseInt(String(page ?? 1)) || 1);
    const l = Math.min(100, Math.max(1, parseInt(String(limit ?? 20)) || 20));
    return { page: p, limit: l, skip: (p - 1) * l };
}

export async function paginate<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    page?: number,
    limit?: number,
): Promise<Page<T>> {
    const { page: p, limit: l, skip } = normalizePage(page, limit);
    const [items, total] = await qb.skip(skip).take(l).getManyAndCount();

    return {
        items,
        meta: {
            page: p,
            limit: l,
            total,
            totalPages: Math.ceil(total / l) || 0,
        },
    };
}
