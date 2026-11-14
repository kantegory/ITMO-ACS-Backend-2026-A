import { MenuCategory } from '../models/menu-category.entity';
import { MenuItem } from '../models/menu-item.entity';
import { Reservation } from '../models/reservation.entity';
import { RestaurantPhoto } from '../models/restaurant-photo.entity';
import { RestaurantTable } from '../models/restaurant-table.entity';
import { Restaurant } from '../models/restaurant.entity';
import { Review } from '../models/review.entity';
import { User } from '../models/user.entity';
import { Cuisine } from '../models/cuisine.entity';
import { Location } from '../models/location.entity';

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

export const serializeRestaurantPhoto = (photo: RestaurantPhoto) => ({
    id: photo.id,
    imageUrl: photo.imageUrl,
    isMain: photo.isMain,
    createdAt: toIsoString(photo.createdAt),
});

export const serializeRestaurantTable = (table: RestaurantTable) => ({
    id: table.id,
    tableNumber: table.tableNumber,
    capacity: table.capacity,
    isActive: table.isActive,
    createdAt: toIsoString(table.createdAt),
    updatedAt: toIsoString(table.updatedAt),
});

export const serializeMenuItem = (item: MenuItem) => ({
    id: item.id,
    title: item.title,
    description: item.description || undefined,
    price: item.price,
    weight: item.weight || undefined,
    isAvailable: item.isAvailable,
    createdAt: toIsoString(item.createdAt),
    updatedAt: toIsoString(item.updatedAt),
});

export const serializeMenuCategory = (category: MenuCategory) => ({
    id: category.id,
    restaurantId: category.restaurant?.id,
    title: category.title,
    items: (category.items || []).map(serializeMenuItem),
    createdAt: toIsoString(category.createdAt),
    updatedAt: toIsoString(category.updatedAt),
});

export const serializeUserProfile = (user: User) => ({
    id: user.id,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    isVerified: user.isVerified,
    createdAt: toIsoString(user.createdAt),
    updatedAt: toIsoString(user.updatedAt),
});

export const serializeAuthUser = serializeUserProfile;

export const serializeReview = (review: Review) => ({
    id: review.id,
    user: {
        id: review.user.id,
        firstName: review.user.firstName,
        lastName: review.user.lastName,
    },
    rating: review.rating,
    comment: review.comment,
    createdAt: toIsoString(review.createdAt),
    updatedAt: toIsoString(review.updatedAt),
});

const getMainPhoto = (restaurant: Restaurant) =>
    (restaurant.photos || []).find((photo) => photo.isMain);

export const serializeRestaurantCard = (restaurant: Restaurant) => ({
    id: restaurant.id,
    title: restaurant.title,
    description: restaurant.description || undefined,
    phone: restaurant.phone,
    email: restaurant.email || undefined,
    openTime: restaurant.openTime,
    closeTime: restaurant.closeTime,
    avgRating: Number(restaurant.avgRating || 0),
    priceCategory: restaurant.priceCategory,
    location: serializeLocation(restaurant.location),
    cuisines: (restaurant.cuisines || []).map(serializeCuisine),
    mainPhoto: getMainPhoto(restaurant)
        ? serializeRestaurantPhoto(getMainPhoto(restaurant) as RestaurantPhoto)
        : undefined,
});

export const serializeRestaurantDetail = (restaurant: Restaurant) => ({
    ...serializeRestaurantCard(restaurant),
    isPublished: restaurant.isPublished,
    tables: (restaurant.tables || []).map(serializeRestaurantTable),
    photos: (restaurant.photos || []).map(serializeRestaurantPhoto),
    menu: (restaurant.menuCategories || []).map(serializeMenuCategory),
    reviewsSummary: {
        totalReviews: (restaurant.reviews || []).length,
        avgRating: Number(restaurant.avgRating || 0),
    },
    createdAt: toIsoString(restaurant.createdAt),
    updatedAt: toIsoString(restaurant.updatedAt),
});

export const serializeReservation = (reservation: Reservation) => ({
    id: reservation.id,
    user: {
        id: reservation.user.id,
        firstName: reservation.user.firstName,
        lastName: reservation.user.lastName,
        email: reservation.user.email,
        phone: reservation.user.phone,
    },
    restaurant: {
        id: reservation.restaurant.id,
        title: reservation.restaurant.title,
        location: serializeLocation(reservation.restaurant.location),
    },
    table: {
        id: reservation.table.id,
        tableNumber: reservation.table.tableNumber,
        capacity: reservation.table.capacity,
    },
    status: reservation.status,
    reservationDate: reservation.reservationDate,
    reservationTime: reservation.reservationTime,
    guestsCount: reservation.guestsCount,
    comment: reservation.comment || undefined,
    createdAt: toIsoString(reservation.createdAt),
    updatedAt: toIsoString(reservation.updatedAt),
});
