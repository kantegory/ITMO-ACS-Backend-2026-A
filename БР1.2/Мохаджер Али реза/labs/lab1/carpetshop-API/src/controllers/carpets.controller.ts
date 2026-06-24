import {
    BadRequestError,
    Body,
    Delete,
    Get,
    NotFoundError,
    Param,
    Patch,
    Post,
    QueryParam,
    UseBefore,
} from 'routing-controllers';
import {
    IsBoolean,
    IsIn,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Carpet, CarpetShape } from '../models/carpet.entity';
import { Category } from '../models/category.entity';
import authMiddleware from '../middlewares/auth.middleware';
import requireAdmin from '../middlewares/require-admin.middleware';
import dataSource from '../config/data-source';
import { CarpetImage } from '../models/carpet-image.entity';
import { Review } from '../models/review.entity';

class CarpetCreateDto {
    @IsString()
    @Type(() => String)
    title: string;

    @IsInt()
    @Type(() => Number)
    category_id: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description?: string;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    price: number;

    @IsInt()
    @Min(0)
    @Type(() => Number)
    stock: number;

    @IsIn(['RECTANGLE', 'SQUARE', 'CIRCLE', 'ELLIPSE', 'RUNNER', 'CUSTOM'])
    @Type(() => String)
    shape: CarpetShape;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    length?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    width?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    diameter?: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    material?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    pattern?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    color?: string;

    @IsOptional()
    @IsBoolean()
    is_handmade?: boolean;

    @IsOptional()
    @IsBoolean()
    is_published?: boolean;
}

class CarpetUpdateDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    title?: string;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    category_id?: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    price?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    stock?: number;

    @IsOptional()
    @IsIn(['RECTANGLE', 'SQUARE', 'CIRCLE', 'ELLIPSE', 'RUNNER', 'CUSTOM'])
    @Type(() => String)
    shape?: CarpetShape;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    length?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    width?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    diameter?: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    material?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    pattern?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    color?: string;

    @IsOptional()
    @IsBoolean()
    is_handmade?: boolean;

    @IsOptional()
    @IsBoolean()
    is_published?: boolean;
}

function toNumberOrUndefined(v: any): number | undefined {
    if (v === undefined || v === null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

@EntityController({ baseRoute: '/carpets', entity: Carpet })
export default class CarpetsController extends BaseController {
    @Get('')
    async list(
        @QueryParam('category_id') category_id?: string,
        @QueryParam('shape') shape?: CarpetShape,
        @QueryParam('material') material?: string,
        @QueryParam('color') color?: string,
        @QueryParam('is_handmade') is_handmade?: string,
        @QueryParam('price_min') price_min?: string,
        @QueryParam('price_max') price_max?: string,
        @QueryParam('limit') limit = 20,
        @QueryParam('offset') offset = 0,
    ) {
        const qb = dataSource
            .getRepository(Carpet)
            .createQueryBuilder('carpet')
            .leftJoinAndSelect('carpet.category', 'category')
            .leftJoin('carpet.images', 'images')
            .leftJoin('carpet.reviews', 'reviews');

        qb.where('carpet.is_published = :pub', { pub: true });

        const catId = toNumberOrUndefined(category_id);
        if (catId !== undefined) qb.andWhere('category.id = :catId', { catId });
        if (shape) qb.andWhere('carpet.shape = :shape', { shape });
        if (material)
            qb.andWhere('carpet.material ILIKE :material', {
                material: `%${material}%`,
            });
        if (color)
            qb.andWhere('carpet.color ILIKE :color', { color: `%${color}%` });

        const handmade =
            is_handmade === undefined
                ? undefined
                : is_handmade === 'true' || is_handmade === '1';
        if (handmade !== undefined)
            qb.andWhere('carpet.is_handmade = :handmade', { handmade });

        const pmin = toNumberOrUndefined(price_min);
        const pmax = toNumberOrUndefined(price_max);
        if (pmin !== undefined) qb.andWhere('carpet.price >= :pmin', { pmin });
        if (pmax !== undefined) qb.andWhere('carpet.price <= :pmax', { pmax });

        qb.take(limit).skip(offset);
        qb.orderBy('carpet.created_at', 'DESC');

        const [items, total] = await qb.getManyAndCount();

        const imgRepo = dataSource.getRepository(CarpetImage);
        const reviewRepo = dataSource.getRepository(Review);

        const mapped = await Promise.all(
            items.map(async (c) => {
                const mainImg = await imgRepo.findOne({
                    where: { carpet: { id: c.id }, is_main: true },
                    order: { created_at: 'ASC' },
                    relations: { carpet: true },
                });
                const count = await reviewRepo.count({
                    where: { carpet: { id: c.id } },
                });
                const avgRaw = await reviewRepo
                    .createQueryBuilder('r')
                    .select('AVG(r.rating)', 'avg')
                    .where('r.carpetId = :id', { id: c.id })
                    .getRawOne<{ avg: string | null }>();

                return {
                    ...c,
                    main_image_url: mainImg?.image_url ?? null,
                    rating_avg: avgRaw?.avg ? Number(avgRaw.avg) : null,
                    reviews_count: count,
                };
            }),
        );

        return { total, limit, offset, items: mapped };
    }

    @Post('')
    @UseBefore(authMiddleware, requireAdmin)
    async create(@Body({ type: CarpetCreateDto }) dto: CarpetCreateDto) {
        const category = await dataSource
            .getRepository(Category)
            .findOneBy({ id: dto.category_id });
        if (!category) throw new BadRequestError('Category not found');

        const carpet = this.repository.create({
            category,
            title: dto.title,
            description: dto.description ?? null,
            price: String(dto.price),
            stock: dto.stock,
            shape: dto.shape,
            length: dto.length !== undefined ? String(dto.length) : null,
            width: dto.width !== undefined ? String(dto.width) : null,
            diameter: dto.diameter !== undefined ? String(dto.diameter) : null,
            material: dto.material ?? null,
            pattern: dto.pattern ?? null,
            color: dto.color ?? null,
            is_handmade: dto.is_handmade ?? false,
            is_published: dto.is_published ?? false,
        });

        return await this.repository.save(carpet);
    }

    @Get('/:id')
    async getById(@Param('id') id: number) {
        const carpet = await dataSource.getRepository(Carpet).findOne({
            where: { id },
            relations: { category: true, images: true },
        });
        if (!carpet) throw new NotFoundError('Carpet not found');

        const reviewRepo = dataSource.getRepository(Review);
        const count = await reviewRepo.count({ where: { carpet: { id } } });
        const avgRaw = await reviewRepo
            .createQueryBuilder('r')
            .select('AVG(r.rating)', 'avg')
            .where('r.carpetId = :id', { id })
            .getRawOne<{ avg: string | null }>();
        const mainImg = carpet.images?.find((i) => i.is_main);

        return {
            ...carpet,
            main_image_url: mainImg?.image_url ?? null,
            rating_avg: avgRaw?.avg ? Number(avgRaw.avg) : null,
            reviews_count: count,
        };
    }

    @Patch('/:id')
    @UseBefore(authMiddleware, requireAdmin)
    async update(
        @Param('id') id: number,
        @Body({ type: CarpetUpdateDto }) dto: CarpetUpdateDto,
    ) {
        const carpetRepo = dataSource.getRepository(Carpet);
        const carpet = await carpetRepo.findOne({
            where: { id },
            relations: { category: true },
        });
        if (!carpet) throw new NotFoundError('Carpet not found');

        if (dto.category_id !== undefined) {
            const category = await dataSource
                .getRepository(Category)
                .findOneBy({ id: dto.category_id });
            if (!category) throw new BadRequestError('Category not found');
            carpet.category = category;
        }

        Object.assign(carpet, {
            ...(dto.title !== undefined ? { title: dto.title } : {}),
            ...(dto.description !== undefined
                ? { description: dto.description }
                : {}),
            ...(dto.price !== undefined ? { price: String(dto.price) } : {}),
            ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
            ...(dto.shape !== undefined ? { shape: dto.shape } : {}),
            ...(dto.length !== undefined
                ? { length: dto.length === null ? null : String(dto.length) }
                : {}),
            ...(dto.width !== undefined
                ? { width: dto.width === null ? null : String(dto.width) }
                : {}),
            ...(dto.diameter !== undefined
                ? {
                      diameter:
                          dto.diameter === null ? null : String(dto.diameter),
                  }
                : {}),
            ...(dto.material !== undefined ? { material: dto.material } : {}),
            ...(dto.pattern !== undefined ? { pattern: dto.pattern } : {}),
            ...(dto.color !== undefined ? { color: dto.color } : {}),
            ...(dto.is_handmade !== undefined
                ? { is_handmade: dto.is_handmade }
                : {}),
            ...(dto.is_published !== undefined
                ? { is_published: dto.is_published }
                : {}),
        });

        return await carpetRepo.save(carpet);
    }

    @Delete('/:id')
    @UseBefore(authMiddleware, requireAdmin)
    async remove(@Param('id') id: number) {
        const carpet = await this.repository.findOneBy({ id });
        if (!carpet) throw new NotFoundError('Carpet not found');
        await this.repository.remove(carpet);
        return;
    }
}
