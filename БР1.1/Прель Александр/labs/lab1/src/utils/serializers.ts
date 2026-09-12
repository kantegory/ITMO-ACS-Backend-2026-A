import { Cuisine, MenuCategory, Reservation, Restaurant, RestaurantPhoto, Review, User } from "../entities";

const toIso = (value: Date | string) => (value instanceof Date ? value.toISOString() : new Date(value).toISOString());

export const toUserResponse = (user: User) => ({
  userId: user.userId,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  createdAt: toIso(user.createdAt),
  updatedAt: toIso(user.updatedAt),
});

export const toCuisineResponse = (cuisine: Cuisine) => ({
  cuisineId: cuisine.cuisineId,
  name: cuisine.name,
});

export const getAverageRating = (restaurant: Restaurant): number | null => {
  const reviews = restaurant.reviews ?? [];
  if (reviews.length === 0) {
    return null;
  }
  const rating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  return Math.round(rating * 10) / 10;
};

export const toRestaurantShortResponse = (restaurant: Restaurant) => ({
  restaurantId: restaurant.restaurantId,
  name: restaurant.name,
  description: restaurant.description,
  address: restaurant.address,
  city: restaurant.city,
  priceCategory: restaurant.priceCategory,
  openingTime: restaurant.openingTime,
  closingTime: restaurant.closingTime,
  cuisines: (restaurant.cuisines ?? []).map(toCuisineResponse),
  averageRating: getAverageRating(restaurant),
  mainPhotoUrl:
    restaurant.photos?.slice().sort((left, right) => left.photoId - right.photoId)[0]?.photoUrl ?? null,
});

export const toRestaurantDetailsResponse = (restaurant: Restaurant) => ({
  ...toRestaurantShortResponse(restaurant),
  phone: restaurant.phone,
  reviewsCount: restaurant.reviews?.length ?? 0,
  photosCount: restaurant.photos?.length ?? 0,
  createdAt: toIso(restaurant.createdAt),
});

export const toMenuCategoryResponse = (category: MenuCategory) => ({
  categoryId: category.categoryId,
  restaurantId: category.restaurant.restaurantId,
  name: category.name,
  items: (category.items ?? []).map((item) => ({
    itemId: item.itemId,
    categoryId: category.categoryId,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    isAvailable: item.isAvailable,
  })),
});

export const toReviewResponse = (review: Review) => ({
  reviewId: review.reviewId,
  userId: review.user.userId,
  restaurantId: review.restaurant.restaurantId,
  userName: `${review.user.firstName} ${review.user.lastName}`,
  rating: review.rating,
  comment: review.comment,
  createdAt: toIso(review.createdAt),
});

export const toRestaurantPhotoResponse = (photo: RestaurantPhoto) => ({
  photoId: photo.photoId,
  restaurantId: photo.restaurant.restaurantId,
  photoUrl: photo.photoUrl,
  uploadedAt: toIso(photo.uploadedAt),
});

export const toReservationResponse = (reservation: Reservation) => ({
  reservationId: reservation.reservationId,
  userId: reservation.user.userId,
  restaurantId: reservation.table.restaurant.restaurantId,
  restaurantName: reservation.table.restaurant.name,
  tableId: reservation.table.tableId,
  tableNumber: reservation.table.tableNumber,
  reservationDate: reservation.reservationDate,
  startTime: reservation.startTime,
  endTime: reservation.endTime,
  guestsCount: reservation.guestsCount,
  status: reservation.status,
  createdAt: toIso(reservation.createdAt),
});
