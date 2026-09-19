import {
    Body,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    QueryParam,
    UseBefore,
    Req,
    NotFoundError,
    BadRequestError,
    HttpCode,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import {
    IsArray,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Restaurant } from '../models/restaurant.entity';
import { RestaurantCuisine } from '../models/restaurant-cuisine.entity';
import { CuisineType } from '../models/cuisine-type.entity';
import { Review } from '../models/review.entity';
import { MenuItem } from '../models/menu-item.entity';
import { RestaurantPhoto } from '../models/restaurant-photo.entity';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import {
    serializeRestaurantList,
    serializeRestaurantDetail,
    serializeReview,
    serializeMenuItem,
    serializePhoto,
} from '../utils/serializers';

class CreateRestaurantDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    address: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(4)
    price_range?: number;

    @IsOptional()
    @IsString()
    district?: string;

    @IsOptional()
    @IsArray()
    cuisine_ids?: number[];
}

class CreateReviewDto {
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @IsOptional()
    @IsString()
    comment?: string;
}

class CreateMenuItemDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @Type(() => Number)
    price: number;
}

class CreatePhotoDto {
    @IsOptional()
    @IsString()
    photo_url?: string;
}

@EntityController({
    baseRoute: '/restaurants',
    entity: Restaurant,
})
class RestaurantController extends BaseController {
    private getListRelations() {
        return ['restaurantCuisines', 'restaurantCuisines.cuisineType', 'reviews'];
    }

    private getDetailRelations() {
        return [
            'restaurantCuisines',
            'restaurantCuisines.cuisineType',
            'menuItems',
            'photos',
            'reviews',
        ];
    }

    @Get('')
    @OpenAPI({
        summary: 'Список ресторанов',
        tags: ['Рестораны'],
        parameters: [
            { name: 'price_range', in: 'query', type: 'number' },
            { name: 'district', in: 'query', type: 'string' },
            { name: 'cuisine', in: 'query', type: 'string' },
            { name: 'search', in: 'query', type: 'string' },
            { name: 'ordering', in: 'query', type: 'string' },
        ],
    })
    async getAll(
        @QueryParam('price_range') priceRange?: number,
        @QueryParam('district') district?: string,
        @QueryParam('cuisine') cuisine?: string,
        @QueryParam('search') search?: string,
        @QueryParam('ordering') ordering?: string,
    ) {
        const queryBuilder = this.repository
            .createQueryBuilder('restaurant')
            .leftJoinAndSelect('restaurant.restaurantCuisines', 'rc')
            .leftJoinAndSelect('rc.cuisineType', 'cuisineType')
            .leftJoinAndSelect('restaurant.reviews', 'reviews');

        if (priceRange) {
            queryBuilder.andWhere('restaurant.priceRange = :priceRange', {
                priceRange,
            });
        }

        if (district) {
            queryBuilder.andWhere('restaurant.district ILIKE :district', {
                district: `%${district}%`,
            });
        }

        if (cuisine) {
            queryBuilder.andWhere('cuisineType.name ILIKE :cuisine', {
                cuisine: `%${cuisine}%`,
            });
        }

        if (search) {
            queryBuilder.andWhere(
                '(restaurant.name ILIKE :search OR restaurant.district ILIKE :search OR restaurant.address ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        if (ordering === 'price_range') {
            queryBuilder.orderBy('restaurant.priceRange', 'ASC');
        } else if (ordering === '-price_range') {
            queryBuilder.orderBy('restaurant.priceRange', 'DESC');
        } else if (ordering === '-created_at') {
            queryBuilder.orderBy('restaurant.createdAt', 'DESC');
        } else {
            queryBuilder.orderBy('restaurant.createdAt', 'ASC');
        }

        const restaurants = await queryBuilder.getMany();
        return restaurants.map(serializeRestaurantList);
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Ресторан', tags: ['Рестораны'] })
    async getById(@Param('id') id: number) {
        const restaurant = await this.repository.findOne({
            where: { id },
            relations: this.getDetailRelations(),
        });

        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        return serializeRestaurantDetail(restaurant);
    }

    @Post('')
    @OpenAPI({ summary: 'Создать ресторан', tags: ['Рестораны'] })
    async create(@Body({ type: CreateRestaurantDto }) data: CreateRestaurantDto) {
        const restaurant = this.repository.create({
            name: data.name,
            description: data.description,
            address: data.address,
            priceRange: data.price_range,
            district: data.district,
        });

        const saved = await this.repository.save(restaurant);

        if (data.cuisine_ids?.length) {
            await this.linkCuisines(saved.id, data.cuisine_ids);
        }

        const full = await this.repository.findOne({
            where: { id: saved.id },
            relations: this.getDetailRelations(),
        });

        return serializeRestaurantDetail(full);
    }

    @Patch('/:id')
    @OpenAPI({ summary: 'Обновить ресторан', tags: ['Рестораны'] })
    async update(
        @Param('id') id: number,
        @Body({ type: CreateRestaurantDto }) data: CreateRestaurantDto,
    ) {
        const restaurant = await this.repository.findOneBy({ id });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        if (data.name !== undefined) restaurant.name = data.name;
        if (data.description !== undefined) restaurant.description = data.description;
        if (data.address !== undefined) restaurant.address = data.address;
        if (data.price_range !== undefined) restaurant.priceRange = data.price_range;
        if (data.district !== undefined) restaurant.district = data.district;

        await this.repository.save(restaurant);

        if (data.cuisine_ids) {
            const rcRepository = dataSource.getRepository(RestaurantCuisine);
            await rcRepository.delete({ restaurantId: id });
            await this.linkCuisines(id, data.cuisine_ids);
        }

        const full = await this.repository.findOne({
            where: { id },
            relations: this.getDetailRelations(),
        });

        return serializeRestaurantDetail(full);
    }

    @Delete('/:id')
    @HttpCode(204)
    @OpenAPI({ summary: 'Удалить ресторан', tags: ['Рестораны'] })
    async delete(@Param('id') id: number) {
        const restaurant = await this.repository.findOneBy({ id });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }
        await this.repository.remove(restaurant);
    }

    @Get('/:id/reviews')
    @OpenAPI({ summary: 'Отзывы ресторана', tags: ['Отзывы'] })
    async getReviews(@Param('id') id: number) {
        await this.ensureRestaurantExists(id);
        const reviewRepository = dataSource.getRepository(Review);
        const reviews = await reviewRepository.find({
            where: { restaurantId: id },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
        return reviews.map(serializeReview);
    }

    @Post('/:id/reviews')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Добавить отзыв', tags: ['Отзывы'] })
    async addReview(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
        @Body({ type: CreateReviewDto }) data: CreateReviewDto,
    ) {
        await this.ensureRestaurantExists(id);

        const reviewRepository = dataSource.getRepository(Review);
        const review = reviewRepository.create({
            restaurantId: id,
            userId: request.user.id,
            rating: data.rating,
            comment: data.comment,
        });

        const saved = await reviewRepository.save(review);
        const full = await reviewRepository.findOne({
            where: { id: saved.id },
            relations: ['user'],
        });

        return serializeReview(full);
    }

    @Get('/:id/photos')
    @OpenAPI({ summary: 'Фото ресторана', tags: ['Фото'] })
    async getPhotos(@Param('id') id: number) {
        await this.ensureRestaurantExists(id);
        const photoRepository = dataSource.getRepository(RestaurantPhoto);
        const photos = await photoRepository.find({
            where: { restaurantId: id },
            order: { createdAt: 'DESC' },
        });
        return photos.map(serializePhoto);
    }

    @Post('/:id/photos')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Загрузить фото', tags: ['Фото'] })
    async addPhoto(
        @Param('id') id: number,
        @Body({ type: CreatePhotoDto }) data: CreatePhotoDto,
    ) {
        await this.ensureRestaurantExists(id);

        const photoRepository = dataSource.getRepository(RestaurantPhoto);
        const photo = photoRepository.create({
            restaurantId: id,
            photoUrl: data.photo_url,
        });

        const saved = await photoRepository.save(photo);
        return serializePhoto(saved);
    }

    @Get('/:id/menu')
    @OpenAPI({ summary: 'Меню ресторана', tags: ['Меню'] })
    async getMenu(@Param('id') id: number) {
        await this.ensureRestaurantExists(id);
        const menuRepository = dataSource.getRepository(MenuItem);
        const items = await menuRepository.find({
            where: { restaurantId: id },
            order: { name: 'ASC' },
        });
        return items.map(serializeMenuItem);
    }

    @Post('/:id/menu')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Добавить блюдо', tags: ['Меню'] })
    async addMenuItem(
        @Param('id') id: number,
        @Body({ type: CreateMenuItemDto }) data: CreateMenuItemDto,
    ) {
        await this.ensureRestaurantExists(id);

        const menuRepository = dataSource.getRepository(MenuItem);
        const item = menuRepository.create({
            restaurantId: id,
            name: data.name,
            description: data.description,
            price: data.price,
        });

        const saved = await menuRepository.save(item);
        return serializeMenuItem(saved);
    }

    private async ensureRestaurantExists(id: number) {
        const restaurant = await this.repository.findOneBy({ id });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }
    }

    private async linkCuisines(restaurantId: number, cuisineIds: number[]) {
        const cuisineRepository = dataSource.getRepository(CuisineType);
        const rcRepository = dataSource.getRepository(RestaurantCuisine);

        for (const cuisineId of cuisineIds) {
            const cuisine = await cuisineRepository.findOneBy({ id: cuisineId });
            if (!cuisine) {
                throw new BadRequestError(`Cuisine type ${cuisineId} not found`);
            }

            const link = rcRepository.create({
                restaurantId,
                cuisineTypeId: cuisineId,
            });
            await rcRepository.save(link);
        }
    }
}

export default RestaurantController;
