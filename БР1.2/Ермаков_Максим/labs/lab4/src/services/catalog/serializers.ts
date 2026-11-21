import { Cuisine, Location, Restaurant, RestaurantPhoto } from './entities';

const toIsoString = (value?: Date | null) => (value ? value.toISOString() : null);

export const serializeLocation = (location: Location) => ({
    id: location.id,
    city: location.city,
    address: location.address,
    district: location.district || undefined,
    metroStation: location.metroStation || undefined,
    createdAt: toIsoString(location.createdAt),
    updatedAt: toIsoString(location.updatedAt),
});

export const serializeCuisine = (cuisine: Cuisine) => ({
    id: cuisine.id,
    title: cuisine.title,
    createdAt: toIsoString(cuisine.createdAt),
    updatedAt: toIsoString(cuisine.updatedAt),
});

export const serializePhoto = (photo: RestaurantPhoto) => ({
    id: photo.id,
    imageUrl: photo.imageUrl,
    isMain: photo.isMain,
    createdAt: toIsoString(photo.createdAt),
    updatedAt: toIsoString(photo.updatedAt),
});

const getMainPhoto = (restaurant: Restaurant) =>
    (restaurant.photos || []).find((photo) => photo.isMain);

export const serializeRestaurant = (restaurant: Restaurant) => ({
    id: restaurant.id,
    title: restaurant.title,
    description: restaurant.description || undefined,
    phone: restaurant.phone,
    email: restaurant.email || undefined,
    openTime: restaurant.openTime,
    closeTime: restaurant.closeTime,
    avgRating: Number(restaurant.avgRating || 0),
    reviewsCount: Number(restaurant.reviewsCount || 0),
    priceCategory: restaurant.priceCategory,
    isPublished: restaurant.isPublished,
    location: serializeLocation(restaurant.location),
    cuisines: (restaurant.cuisines || []).map(serializeCuisine),
    mainPhoto: getMainPhoto(restaurant) ? serializePhoto(getMainPhoto(restaurant) as RestaurantPhoto) : undefined,
    photos: (restaurant.photos || []).map(serializePhoto),
    createdAt: toIsoString(restaurant.createdAt),
    updatedAt: toIsoString(restaurant.updatedAt),
});
