import 'reflect-metadata';
import { asyncHandler, createServiceApp, errorHandler } from '../../common/service-app';
import { ApiError, conflict, forbidden, notFound } from '../../common/api-error';
import { authContextMiddleware, RequestWithAuth } from '../../common/auth-context';
import { UserRole } from '../../common/enums';
import { RestaurantRatingRecalculatedEvent, REVIEW_RATING_RECALCULATED } from '../../common/events';
import { serviceRequest } from '../../common/http-client';
import { publishEvent } from '../../common/message-bus';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';
import { getParam } from '../../common/request-params';
import { SETTINGS } from '../../common/settings';
import { reviewDataSource } from './data-source';
import { Review } from './review.entity';
import { serializeReview } from './serializers';

const app = createServiceApp('review-service');
const reviews = () => reviewDataSource.getRepository(Review);

const ensureRestaurantExists = async (restaurantId: string, requestId?: string) => {
    await serviceRequest(
        SETTINGS.CATALOG_SERVICE_URL,
        `/internal/restaurants/${restaurantId}/summary?requirePublished=true`,
        { requestId },
    );
};

const getReviewOrFail = async (reviewId: string) => {
    const review = await reviews().findOneBy({ id: reviewId });
    if (!review) {
        throw notFound('REVIEW_NOT_FOUND', 'Review is not found');
    }
    return review;
};

const recalculateRestaurantRating = async (restaurantId: string, requestId?: string) => {
    const restaurantReviews = await reviews().findBy({ restaurantId });
    const reviewsCount = restaurantReviews.length;
    const avgRating = reviewsCount
        ? Number((restaurantReviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviewsCount).toFixed(2))
        : 0;

    await publishEvent<RestaurantRatingRecalculatedEvent>(REVIEW_RATING_RECALCULATED, {
        eventId: requestId || `${restaurantId}-${Date.now()}`,
        occurredAt: new Date().toISOString(),
        source: 'review-service',
        restaurantId,
        avgRating,
        reviewsCount,
    });

    return { restaurantId, avgRating, reviewsCount };
};

app.get('/restaurants/:restaurantId/reviews', asyncHandler(async (request, response) => {
    const restaurantId = getParam(request.params.restaurantId, 'restaurantId');
    const { page, limit } = normalizePagination(request.query.page, request.query.limit);
    const [items, totalItems] = await reviews().findAndCount({
        where: { restaurantId },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
    });
    response.send({
        data: await Promise.all(items.map((review) => serializeReview(review, (request as any).requestId))),
        meta: buildPaginationMeta(page, limit, totalItems),
    });
}));

app.post('/restaurants/:restaurantId/reviews', authContextMiddleware, asyncHandler(async (request: RequestWithAuth, response) => {
    const restaurantId = getParam(request.params.restaurantId, 'restaurantId');
    await ensureRestaurantExists(restaurantId, (request as any).requestId);

    const existing = await reviews().findOneBy({
        restaurantId,
        userId: request.auth?.userId,
    });
    if (existing) {
        throw conflict('REVIEW_EXISTS', 'You have already left a review for this restaurant');
    }

    const rating = Number(request.body?.rating);
    if (rating < 1 || rating > 5) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'Rating must be from 1 to 5');
    }

    const created = await reviews().save(reviews().create({
        restaurantId,
        userId: request.auth?.userId,
        rating,
        comment: request.body?.comment,
    }));
    await recalculateRestaurantRating(restaurantId, (request as any).requestId);

    response.status(201).send({ data: await serializeReview(created, (request as any).requestId) });
}));

app.patch('/restaurants/:restaurantId/reviews/:reviewId', authContextMiddleware, asyncHandler(async (request: RequestWithAuth, response) => {
    const restaurantId = getParam(request.params.restaurantId, 'restaurantId');
    const review = await getReviewOrFail(getParam(request.params.reviewId, 'reviewId'));
    if (review.restaurantId !== restaurantId) {
        throw notFound('REVIEW_NOT_FOUND', 'Review is not found');
    }
    if (review.userId !== request.auth?.userId && request.auth?.role !== UserRole.ADMIN) {
        throw forbidden('You can update only your own review');
    }

    const body = request.body || {};
    if (body.rating !== undefined) {
        const rating = Number(body.rating);
        if (rating < 1 || rating > 5) {
            throw new ApiError(422, 'VALIDATION_ERROR', 'Rating must be from 1 to 5');
        }
        review.rating = rating;
    }
    if (body.comment !== undefined) {
        review.comment = body.comment;
    }

    const updated = await reviews().save(review);
    await recalculateRestaurantRating(review.restaurantId, (request as any).requestId);
    response.send({ data: await serializeReview(updated, (request as any).requestId) });
}));

app.get('/internal/restaurants/:restaurantId/rating-summary', asyncHandler(async (request, response) => {
    const restaurantId = getParam(request.params.restaurantId, 'restaurantId');
    const restaurantReviews = await reviews().findBy({ restaurantId });
    const reviewsCount = restaurantReviews.length;
    const avgRating = reviewsCount
        ? Number((restaurantReviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviewsCount).toFixed(2))
        : 0;
    response.send({ data: { restaurantId, avgRating, reviewsCount } });
}));

app.get('/internal/restaurants/:restaurantId/reviews-summary', asyncHandler(async (request, response) => {
    const restaurantId = getParam(request.params.restaurantId, 'restaurantId');
    const { page, limit } = normalizePagination(request.query.page, request.query.limit);
    const [items, totalItems] = await reviews().findAndCount({
        where: { restaurantId },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
    });
    response.send({
        data: items.map((review) => ({
            id: review.id,
            restaurantId: review.restaurantId,
            userId: review.userId,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt.toISOString(),
            updatedAt: review.updatedAt.toISOString(),
        })),
        meta: buildPaginationMeta(page, limit, totalItems),
    });
}));

app.use(errorHandler);

reviewDataSource.initialize()
    .then(() => {
        app.listen(SETTINGS.REVIEW_PORT, SETTINGS.REVIEW_HOST, () => {
            console.log(`review-service listening at http://${SETTINGS.REVIEW_HOST}:${SETTINGS.REVIEW_PORT}`);
        });
    })
    .catch((error) => {
        console.error('review-service failed to start', error);
        process.exit(1);
    });
