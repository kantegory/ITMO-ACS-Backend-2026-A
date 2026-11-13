import 'reflect-metadata';
import { In } from 'typeorm';
import { asyncHandler, createServiceApp, errorHandler } from '../../common/service-app';
import { ApiError, notFound } from '../../common/api-error';
import { authContextMiddleware, requireRole } from '../../common/auth-context';
import { PriceCategory, UserRole } from '../../common/enums';
import { RestaurantRatingRecalculatedEvent, REVIEW_RATING_RECALCULATED } from '../../common/events';
import { consumeEvents } from '../../common/message-bus';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';
import { getParam } from '../../common/request-params';
import { SETTINGS } from '../../common/settings';
import { containsIgnoreCase } from '../../common/validation';
import { catalogDataSource } from './data-source';
import { Cuisine, Location, Restaurant, RestaurantPhoto } from './entities';
import { bootstrapCatalogData } from './bootstrap';
import { serializeCuisine, serializeLocation, serializePhoto, serializeRestaurant } from './serializers';

const app = createServiceApp('catalog-service');
const locations = () => catalogDataSource.getRepository(Location);
const cuisines = () => catalogDataSource.getRepository(Cuisine);
const restaurants = () => catalogDataSource.getRepository(Restaurant);
const photos = () => catalogDataSource.getRepository(RestaurantPhoto);

const restaurantRelations = {
    location: true,
    cuisines: true,
    photos: true,
} as const;

const getRestaurantOrFail = async (restaurantId: string, requirePublished = false) => {
    const restaurant = await restaurants().findOne({
        where: {
            id: restaurantId,
            ...(requirePublished ? { isPublished: true } : {}),
        },
        relations: restaurantRelations,
    });
    if (!restaurant) {
        throw notFound('RESTAURANT_NOT_FOUND', 'Restaurant is not found');
    }
    return restaurant;
};

const getLocationOrFail = async (locationId: string) => {
    const location = await locations().findOneBy({ id: locationId });
    if (!location) {
        throw notFound('LOCATION_NOT_FOUND', 'Location is not found');
    }
    return location;
};

const getCuisines = async (cuisineIds?: string[]) => {
    if (!cuisineIds) {
        return undefined;
    }
    const found = await cuisines().findBy({ id: In(cuisineIds) });
    if (found.length !== cuisineIds.length) {
        throw notFound('CUISINE_NOT_FOUND', 'One or more cuisines are not found');
    }
    return found;
};

const makePhotoMain = async (restaurantId: string, photoId?: string) => {
    const restaurantPhotos = await photos().find({
        where: { restaurant: { id: restaurantId } },
        relations: { restaurant: true },
    });
    for (const photo of restaurantPhotos) {
        photo.isMain = photo.id === photoId;
    }
    await photos().save(restaurantPhotos);
};

const applyRestaurantRatingSummary = async (restaurantId: string, avgRating: number, reviewsCount: number) => {
    if (avgRating < 0 || avgRating > 5 || reviewsCount < 0) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'Rating summary is invalid');
    }

    const restaurant = await getRestaurantOrFail(restaurantId, false);
    restaurant.avgRating = avgRating;
    restaurant.reviewsCount = reviewsCount;
    await restaurants().save(restaurant);
    return { restaurantId: restaurant.id, avgRating, reviewsCount };
};

const startRatingConsumer = async () => {
    await consumeEvents<RestaurantRatingRecalculatedEvent>(
        SETTINGS.RABBITMQ_CATALOG_RATING_QUEUE,
        [REVIEW_RATING_RECALCULATED],
        async (event) => {
            await applyRestaurantRatingSummary(event.restaurantId, event.avgRating, event.reviewsCount);
            console.log(
                `catalog-service applied ${REVIEW_RATING_RECALCULATED} for restaurant ${event.restaurantId}`,
            );
        },
    );
};

app.get('/reference/cuisines', asyncHandler(async (_request, response) => {
    const items = await cuisines().find({ order: { title: 'ASC' } });
    response.send({ data: items.map(serializeCuisine) });
}));

app.get('/reference/locations', asyncHandler(async (_request, response) => {
    const items = await locations().find({ order: { city: 'ASC', address: 'ASC' } });
    response.send({ data: items.map(serializeLocation) });
}));

app.get('/reference/price-categories', (_request, response) => {
    response.send({
        data: [
            { code: PriceCategory.LOW, label: 'Low' },
            { code: PriceCategory.MEDIUM, label: 'Medium' },
            { code: PriceCategory.HIGH, label: 'High' },
        ],
    });
});

app.get('/restaurants', asyncHandler(async (request, response) => {
    const { page, limit } = normalizePagination(request.query.page, request.query.limit);
    const allRestaurants = await restaurants().find({
        where: { isPublished: true },
        relations: restaurantRelations,
        order: { title: 'ASC' },
    });

    const filtered = allRestaurants.filter((restaurant) => {
        if (!containsIgnoreCase(restaurant.location.city, request.query.city as string)) return false;
        if (!containsIgnoreCase(restaurant.location.district, request.query.district as string)) return false;
        if (!containsIgnoreCase(restaurant.location.metroStation, request.query.metroStation as string)) return false;
        if (request.query.priceCategory && restaurant.priceCategory !== request.query.priceCategory) return false;
        if (request.query.cuisineId && !(restaurant.cuisines || []).some((cuisine) => cuisine.id === request.query.cuisineId)) return false;
        return true;
    });

    const paginated = filtered.slice((page - 1) * limit, (page - 1) * limit + limit);
    response.send({
        data: paginated.map(serializeRestaurant),
        meta: buildPaginationMeta(page, limit, filtered.length),
    });
}));

app.get('/restaurants/:restaurantId', asyncHandler(async (request, response) => {
    response.send({
        data: serializeRestaurant(await getRestaurantOrFail(getParam(request.params.restaurantId, 'restaurantId'), true)),
    });
}));

app.get('/restaurants/:restaurantId/photos', asyncHandler(async (request, response) => {
    const restaurant = await getRestaurantOrFail(getParam(request.params.restaurantId, 'restaurantId'), true);
    response.send({
        restaurantId: restaurant.id,
        data: (restaurant.photos || []).map(serializePhoto),
    });
}));

app.post('/admin/locations', authContextMiddleware, requireRole(UserRole.ADMIN), asyncHandler(async (request, response) => {
    const created = await locations().save(locations().create(request.body as Partial<Location>));
    response.status(201).send({ data: serializeLocation(created) });
}));

app.patch('/admin/locations/:locationId', authContextMiddleware, requireRole(UserRole.ADMIN), asyncHandler(async (request, response) => {
    const location = await getLocationOrFail(getParam(request.params.locationId, 'locationId'));
    Object.assign(location, request.body);
    response.send({ data: serializeLocation(await locations().save(location)) });
}));

app.post('/admin/restaurants', authContextMiddleware, requireRole(UserRole.ADMIN), asyncHandler(async (request, response) => {
    const body = request.body || {};
    const location = await getLocationOrFail(body.locationId);
    const restaurantCuisines = await getCuisines(body.cuisineIds);
    const created = await restaurants().save(restaurants().create({
        title: body.title,
        description: body.description,
        phone: body.phone,
        email: body.email,
        openTime: body.openTime,
        closeTime: body.closeTime,
        priceCategory: body.priceCategory,
        isPublished: body.isPublished || false,
        location,
        cuisines: restaurantCuisines || [],
    }));
    response.status(201).send({ data: serializeRestaurant(await getRestaurantOrFail(created.id)) });
}));

app.patch('/admin/restaurants/:restaurantId', authContextMiddleware, requireRole(UserRole.ADMIN), asyncHandler(async (request, response) => {
    const body = request.body || {};
    const restaurant = await getRestaurantOrFail(getParam(request.params.restaurantId, 'restaurantId'));
    if (body.locationId) {
        restaurant.location = await getLocationOrFail(body.locationId);
    }
    if (body.cuisineIds) {
        restaurant.cuisines = await getCuisines(body.cuisineIds) || [];
    }
    Object.assign(restaurant, {
        title: body.title ?? restaurant.title,
        description: body.description !== undefined ? body.description : restaurant.description,
        phone: body.phone ?? restaurant.phone,
        email: body.email !== undefined ? body.email : restaurant.email,
        openTime: body.openTime ?? restaurant.openTime,
        closeTime: body.closeTime ?? restaurant.closeTime,
        priceCategory: body.priceCategory ?? restaurant.priceCategory,
    });
    await restaurants().save(restaurant);
    response.send({ data: serializeRestaurant(await getRestaurantOrFail(restaurant.id)) });
}));

app.patch('/admin/restaurants/:restaurantId/publication', authContextMiddleware, requireRole(UserRole.ADMIN), asyncHandler(async (request, response) => {
    const restaurant = await getRestaurantOrFail(getParam(request.params.restaurantId, 'restaurantId'));
    restaurant.isPublished = Boolean(request.body?.isPublished);
    await restaurants().save(restaurant);
    response.send({ data: serializeRestaurant(await getRestaurantOrFail(restaurant.id)) });
}));

app.post('/admin/restaurants/:restaurantId/photos', authContextMiddleware, requireRole(UserRole.ADMIN), asyncHandler(async (request, response) => {
    const restaurant = await getRestaurantOrFail(getParam(request.params.restaurantId, 'restaurantId'));
    const created = await photos().save(photos().create({
        restaurant,
        imageUrl: request.body?.imageUrl,
        isMain: request.body?.isMain ?? false,
    }));
    if (created.isMain) {
        await makePhotoMain(restaurant.id, created.id);
    }
    response.status(201).send({ data: serializePhoto(created) });
}));

app.patch('/admin/photos/:photoId', authContextMiddleware, requireRole(UserRole.ADMIN), asyncHandler(async (request, response) => {
    const photo = await photos().findOne({ where: { id: getParam(request.params.photoId, 'photoId') }, relations: { restaurant: true } });
    if (!photo) {
        throw notFound('PHOTO_NOT_FOUND', 'Photo is not found');
    }
    photo.imageUrl = request.body?.imageUrl ?? photo.imageUrl;
    photo.isMain = request.body?.isMain ?? photo.isMain;
    const updated = await photos().save(photo);
    if (request.body?.isMain === true) {
        await makePhotoMain(photo.restaurant.id, photo.id);
    }
    response.send({ data: serializePhoto(updated) });
}));

app.get('/internal/restaurants/:restaurantId/summary', asyncHandler(async (request, response) => {
    const requirePublished = request.query.requirePublished !== 'false';
    response.send({
        data: serializeRestaurant(await getRestaurantOrFail(getParam(request.params.restaurantId, 'restaurantId'), requirePublished)),
    });
}));

app.post('/internal/restaurants/summaries', asyncHandler(async (request, response) => {
    const restaurantIds = request.body?.restaurantIds || [];
    const requirePublished = request.body?.requirePublished !== false;
    const found = restaurantIds.length ? await restaurants().find({
        where: {
            id: In(restaurantIds),
            ...(requirePublished ? { isPublished: true } : {}),
        },
        relations: restaurantRelations,
    }) : [];
    response.send({ data: found.map(serializeRestaurant) });
}));

app.patch('/internal/restaurants/:restaurantId/rating-summary', asyncHandler(async (request, response) => {
    response.send({
        data: await applyRestaurantRatingSummary(
            getParam(request.params.restaurantId, 'restaurantId'),
            Number(request.body?.avgRating || 0),
            Number(request.body?.reviewsCount || 0),
        ),
    });
}));

app.use(errorHandler);

catalogDataSource.initialize()
    .then(bootstrapCatalogData)
    .then(startRatingConsumer)
    .then(() => {
        app.listen(SETTINGS.CATALOG_PORT, SETTINGS.CATALOG_HOST, () => {
            console.log(`catalog-service listening at http://${SETTINGS.CATALOG_HOST}:${SETTINGS.CATALOG_PORT}`);
        });
    })
    .catch((error) => {
        console.error('catalog-service failed to start', error);
        process.exit(1);
    });
