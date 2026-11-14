import {
    Body,
    Get,
    HttpCode,
    JsonController,
    Param,
    Post,
    Patch,
    QueryParams,
    Req,
    UseBefore,
} from 'routing-controllers';
import { Type } from 'class-transformer';
import { OpenAPI } from 'routing-controllers-openapi';
import {
    ArrayUnique,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    Max,
    Min,
} from 'class-validator';
import dataSource from '../config/data-source';
import { ApiError } from '../common/api-error';
import { PriceCategory, ReservationStatus } from '../common/enums';
import { buildPaginationMeta, normalizePagination } from '../common/pagination';
import {
    serializeReservation,
    serializeRestaurantCard,
    serializeRestaurantDetail,
    serializeRestaurantPhoto,
    serializeRestaurantTable,
    serializeReview,
} from '../common/serializers';
import {
    containsIgnoreCase,
    DATE_REGEX,
    TIME_REGEX,
} from '../common/validation';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import { Reservation } from '../models/reservation.entity';
import { Restaurant } from '../models/restaurant.entity';
import { Review } from '../models/review.entity';
import { recalculateRestaurantRating } from '../utils/restaurant-rating';

class SearchRestaurantsQueryDto {
    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    district?: string;

    @IsOptional()
    @IsString()
    metroStation?: string;

    @IsOptional()
    @IsString()
    cuisineId?: string;

    @IsOptional()
    @IsEnum(PriceCategory)
    priceCategory?: PriceCategory;

    @IsOptional()
    @IsString()
    @Matches(DATE_REGEX)
    reservationDate?: string;

    @IsOptional()
    @IsString()
    @Matches(TIME_REGEX)
    reservationTime?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    guestsCount?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number;
}

class RestaurantReviewListQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number;
}

class RestaurantAvailabilityQueryDto {
    @IsString()
    @Matches(DATE_REGEX)
    reservationDate: string;

    @IsString()
    @Matches(TIME_REGEX)
    reservationTime: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    guestsCount: number;
}

class CreateRestaurantReviewDto {
    @Type(() => Number)
    @Min(1)
    @Max(5)
    rating: number;

    @IsString()
    @IsNotEmpty()
    comment: string;
}

class UpdateRestaurantReviewDto {
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @Max(5)
    rating?: number;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    comment?: string;
}

@JsonController('/restaurants')
class RestaurantsController {
    private restaurantRepository = dataSource.getRepository(Restaurant);
    private reviewRepository = dataSource.getRepository(Review);
    private reservationRepository = dataSource.getRepository(Reservation);

    private restaurantRelations = {
        location: true,
        cuisines: true,
        tables: true,
        photos: true,
        menuCategories: {
            items: true,
        },
        reviews: {
            user: true,
        },
    } as const;

    private async getPublicRestaurantOrFail(restaurantId: string) {
        const restaurant = await this.restaurantRepository.findOne({
            where: {
                id: restaurantId,
                isPublished: true,
            },
            relations: this.restaurantRelations,
        });

        if (!restaurant) {
            throw new ApiError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant is not found');
        }

        return restaurant;
    }

    private async getBusyTableIds(
        restaurantId: string,
        reservationDate: string,
        reservationTime: string,
        excludedReservationId?: string,
    ) {
        const reservations = await this.reservationRepository.find({
            where: {
                restaurant: {
                    id: restaurantId,
                },
                reservationDate,
                reservationTime,
            },
            relations: {
                table: true,
            },
        });

        return reservations
            .filter((reservation) => reservation.id !== excludedReservationId)
            .filter((reservation) =>
                [
                    ReservationStatus.PENDING,
                    ReservationStatus.CONFIRMED,
                    ReservationStatus.COMPLETED,
                ].includes(reservation.status),
            )
            .map((reservation) => reservation.table.id);
    }

    @Get()
    async search(@QueryParams() query: SearchRestaurantsQueryDto) {
        const { page, limit } = normalizePagination(query.page, query.limit);

        const restaurants = await this.restaurantRepository.find({
            where: {
                isPublished: true,
            },
            relations: {
                location: true,
                cuisines: true,
                photos: true,
                tables: true,
            },
            order: {
                title: 'ASC',
            },
        });

        const filteredRestaurants = [];
        for (const restaurant of restaurants) {
            if (!containsIgnoreCase(restaurant.location.city, query.city)) {
                continue;
            }
            if (!containsIgnoreCase(restaurant.location.district, query.district)) {
                continue;
            }
            if (!containsIgnoreCase(restaurant.location.metroStation, query.metroStation)) {
                continue;
            }
            if (
                query.priceCategory &&
                restaurant.priceCategory !== query.priceCategory
            ) {
                continue;
            }
            if (
                query.cuisineId &&
                !(restaurant.cuisines || []).some((cuisine) => cuisine.id === query.cuisineId)
            ) {
                continue;
            }

            const activeTables = (restaurant.tables || []).filter(
                (table) =>
                    table.isActive &&
                    (!query.guestsCount || table.capacity >= query.guestsCount),
            );

            if (query.guestsCount && activeTables.length === 0) {
                continue;
            }

            if (query.reservationDate && query.reservationTime && query.guestsCount) {
                const busyTableIds = await this.getBusyTableIds(
                    restaurant.id,
                    query.reservationDate,
                    query.reservationTime,
                );
                const hasAvailableTable = activeTables.some(
                    (table) => !busyTableIds.includes(table.id),
                );

                if (!hasAvailableTable) {
                    continue;
                }
            }

            filteredRestaurants.push(restaurant);
        }

        const paginated = filteredRestaurants.slice(
            (page - 1) * limit,
            (page - 1) * limit + limit,
        );

        return {
            data: paginated.map(serializeRestaurantCard),
            meta: buildPaginationMeta(page, limit, filteredRestaurants.length),
        };
    }

    @Get('/:restaurantId')
    async getById(@Param('restaurantId') restaurantId: string) {
        const restaurant = await this.getPublicRestaurantOrFail(restaurantId);

        return {
            data: serializeRestaurantDetail(restaurant),
        };
    }

    @Get('/:restaurantId/menu')
    async getMenu(@Param('restaurantId') restaurantId: string) {
        const restaurant = await this.getPublicRestaurantOrFail(restaurantId);

        return {
            restaurantId: restaurant.id,
            data: (restaurant.menuCategories || []).map((category) => ({
                id: category.id,
                restaurantId: restaurant.id,
                title: category.title,
                items: (category.items || []).map((item) => ({
                    id: item.id,
                    title: item.title,
                    description: item.description || undefined,
                    price: item.price,
                    weight: item.weight || undefined,
                    isAvailable: item.isAvailable,
                    createdAt: item.createdAt.toISOString(),
                    updatedAt: item.updatedAt.toISOString(),
                })),
                createdAt: category.createdAt.toISOString(),
                updatedAt: category.updatedAt.toISOString(),
            })),
        };
    }

    @Get('/:restaurantId/photos')
    async getPhotos(@Param('restaurantId') restaurantId: string) {
        const restaurant = await this.getPublicRestaurantOrFail(restaurantId);

        return {
            restaurantId: restaurant.id,
            data: (restaurant.photos || []).map(serializeRestaurantPhoto),
        };
    }

    @Get('/:restaurantId/reviews')
    async getReviews(
        @Param('restaurantId') restaurantId: string,
        @QueryParams() query: RestaurantReviewListQueryDto,
    ) {
        await this.getPublicRestaurantOrFail(restaurantId);

        const { page, limit } = normalizePagination(query.page, query.limit);
        const [reviews, totalItems] = await this.reviewRepository.findAndCount({
            where: {
                restaurant: {
                    id: restaurantId,
                },
            },
            relations: {
                user: true,
            },
            order: {
                createdAt: 'DESC',
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            data: reviews.map(serializeReview),
            meta: buildPaginationMeta(page, limit, totalItems),
        };
    }

    @Post('/:restaurantId/reviews')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({
        security: [{ bearerAuth: [] }],
    })
    async createReview(
        @Param('restaurantId') restaurantId: string,
        @Body() body: CreateRestaurantReviewDto,
        @Req() request: RequestWithUser,
    ) {
        const restaurant = await this.getPublicRestaurantOrFail(restaurantId);

        const existingReview = await this.reviewRepository.findOne({
            where: {
                restaurant: {
                    id: restaurantId,
                },
                user: {
                    id: (request.user as any).id,
                },
            },
        });

        if (existingReview) {
            throw new ApiError(
                409,
                'REVIEW_EXISTS',
                'You have already left a review for this restaurant',
            );
        }

        const review = this.reviewRepository.create({
            restaurant,
            user: request.user,
            rating: body.rating,
            comment: body.comment,
        });

        const savedReview = await this.reviewRepository.save(review);
        await recalculateRestaurantRating(restaurantId);

        const reviewWithUser = await this.reviewRepository.findOne({
            where: {
                id: savedReview.id,
            },
            relations: {
                user: true,
            },
        });

        return {
            data: serializeReview(reviewWithUser as Review),
        };
    }

    @Patch('/:restaurantId/reviews/:reviewId')
    @UseBefore(authMiddleware)
    @OpenAPI({
        security: [{ bearerAuth: [] }],
    })
    async updateReview(
        @Param('restaurantId') restaurantId: string,
        @Param('reviewId') reviewId: string,
        @Body() body: UpdateRestaurantReviewDto,
        @Req() request: RequestWithUser,
    ) {
        await this.getPublicRestaurantOrFail(restaurantId);

        const review = await this.reviewRepository.findOne({
            where: {
                id: reviewId,
            },
            relations: {
                user: true,
                restaurant: true,
            },
        });

        if (!review || review.restaurant.id !== restaurantId) {
            throw new ApiError(404, 'REVIEW_NOT_FOUND', 'Review is not found');
        }

        if (review.user.id !== request.user?.id) {
            throw new ApiError(403, 'FORBIDDEN', 'You can update only your own review');
        }

        if (body.rating !== undefined) {
            review.rating = body.rating;
        }
        if (body.comment !== undefined) {
            review.comment = body.comment;
        }

        const updatedReview = await this.reviewRepository.save(review);
        await recalculateRestaurantRating(restaurantId);

        return {
            data: serializeReview(updatedReview),
        };
    }

    @Get('/:restaurantId/availability')
    async getAvailability(
        @Param('restaurantId') restaurantId: string,
        @QueryParams() query: RestaurantAvailabilityQueryDto,
    ) {
        const restaurant = await this.getPublicRestaurantOrFail(restaurantId);
        const busyTableIds = await this.getBusyTableIds(
            restaurant.id,
            query.reservationDate,
            query.reservationTime,
        );

        const availableTables = (restaurant.tables || [])
            .filter((table) => table.isActive && table.capacity >= query.guestsCount)
            .filter((table) => !busyTableIds.includes(table.id))
            .map((table) => ({
                id: table.id,
                tableNumber: table.tableNumber,
                capacity: table.capacity,
            }));

        return {
            restaurantId: restaurant.id,
            reservationDate: query.reservationDate,
            reservationTime: query.reservationTime,
            guestsCount: query.guestsCount,
            data: availableTables,
        };
    }
}

export default RestaurantsController;
