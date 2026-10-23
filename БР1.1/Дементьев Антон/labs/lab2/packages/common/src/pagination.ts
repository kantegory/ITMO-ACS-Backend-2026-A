import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Общие параметры страницы: ?page=1&size=20 (page с 1, size не больше 100)
export class PageQuery {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    size: number = 20;
}

export const paginate = <T>(
    items: T[],
    page: number,
    size: number,
    total: number,
) => ({
    items,
    meta: {
        page,
        size,
        total_items: total,
        total_pages: Math.ceil(total / size),
    },
});

export const pageOptions = (q: PageQuery) => ({
    skip: (q.page - 1) * q.size,
    take: q.size,
});
