import "@typespec/http";
import "./common.tsp";
import "./user.tsp";

using Http;

namespace RestaurantBookingApi;

model Location {
  id: string;
  city: string;
  address: string;
  district?: string;
  metroStation?: string;
  createdAt: string;
  updatedAt: string;
}

model LocationResponse {
  data: Location;
}

model CreateLocationRequest {
  city: string;
  address: string;
  district?: string;
  metroStation?: string;
}

model UpdateLocationRequest {
  city?: string;
  address?: string;
  district?: string;
  metroStation?: string;
}

model CreateLocationResponse {
  @statusCode statusCode: 201;
  data: Location;
}

model LocationListResponse {
  data: Location[];
}

model Cuisine {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

model CuisineListResponse {
  data: Cuisine[];
}

model RestaurantPhoto {
  id: string;
  imageUrl: string;
  isMain: boolean;
  createdAt: string;
}

model RestaurantPhotoResponse {
  data: RestaurantPhoto;
}

model CreateRestaurantPhotoRequest {
  imageUrl: string;
  isMain?: boolean;
}

model UpdateRestaurantPhotoRequest {
  imageUrl?: string;
  isMain?: boolean;
}

model CreateRestaurantPhotoResponse {
  @statusCode statusCode: 201;
  data: RestaurantPhoto;
}

model RestaurantPhotoListResponse {
  restaurantId: string;
  data: RestaurantPhoto[];
}

model RestaurantTable {
  id: string;
  tableNumber: string;
  capacity: int32;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

model RestaurantTableResponse {
  data: RestaurantTable;
}

model CreateRestaurantTableRequest {
  tableNumber: string;
  capacity: int32;
  isActive?: boolean;
}

model UpdateRestaurantTableRequest {
  tableNumber?: string;
  capacity?: int32;
  isActive?: boolean;
}

model CreateRestaurantTableResponse {
  @statusCode statusCode: 201;
  data: RestaurantTable;
}

model AvailableTable {
  id: string;
  tableNumber: string;
  capacity: int32;
}

model MenuItem {
  id: string;
  title: string;
  description?: string;
  price: float64;
  weight?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

model MenuItemResponse {
  data: MenuItem;
}

model CreateMenuItemRequest {
  title: string;
  description?: string;
  price: float64;
  weight?: string;
  isAvailable?: boolean;
}

model UpdateMenuItemRequest {
  title?: string;
  description?: string;
  price?: float64;
  weight?: string;
  isAvailable?: boolean;
}

model CreateMenuItemResponse {
  @statusCode statusCode: 201;
  data: MenuItem;
}

model MenuCategory {
  id: string;
  restaurantId: string;
  title: string;
  items: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

model MenuCategoryResponse {
  data: MenuCategory;
}

model CreateMenuCategoryRequest {
  title: string;
}

model UpdateMenuCategoryRequest {
  title?: string;
}

model CreateMenuCategoryResponse {
  @statusCode statusCode: 201;
  data: MenuCategory;
}

model ReviewsSummary {
  totalReviews: int32;
  avgRating: float32;
}

model RestaurantCard {
  id: string;
  title: string;
  description?: string;
  phone: string;
  email?: string;
  openTime: string;
  closeTime: string;
  avgRating: float32;
  priceCategory: PriceCategory;
  location: Location;
  cuisines: Cuisine[];
  mainPhoto?: RestaurantPhoto;
}

model RestaurantDetail extends RestaurantCard {
  isPublished: boolean;
  tables: RestaurantTable[];
  photos: RestaurantPhoto[];
  menu: MenuCategory[];
  reviewsSummary: ReviewsSummary;
  createdAt: string;
  updatedAt: string;
}

model RestaurantDetailResponse {
  data: RestaurantDetail;
}

model RestaurantListResponse {
  data: RestaurantCard[];
  meta: PaginationMeta;
}

model SearchRestaurantsQuery {
  city?: string;
  district?: string;
  metroStation?: string;
  cuisineId?: string;
  priceCategory?: PriceCategory;
  reservationDate?: string;
  reservationTime?: string;
  guestsCount?: int32;
  page?: int32;
  limit?: int32;
}

model RestaurantAvailabilityQuery {
  reservationDate: string;
  reservationTime: string;
  guestsCount: int32;
}

model RestaurantAvailabilityResponse {
  restaurantId: string;
  reservationDate: string;
  reservationTime: string;
  guestsCount: int32;
  data: AvailableTable[];
}

model RestaurantMenuResponse {
  restaurantId: string;
  data: MenuCategory[];
}

model RestaurantReview {
  id: string;
  user: ReviewAuthor;
  rating: float32;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

model RestaurantReviewResponse {
  data: RestaurantReview;
}

model RestaurantReviewListQuery {
  page?: int32;
  limit?: int32;
}

model RestaurantReviewListResponse {
  data: RestaurantReview[];
  meta: PaginationMeta;
}

model CreateRestaurantReviewRequest {
  rating: float32;
  comment: string;
}

model UpdateRestaurantReviewRequest {
  rating?: float32;
  comment?: string;
}

model CreateRestaurantReviewResponse {
  @statusCode statusCode: 201;
  data: RestaurantReview;
}

model CreateRestaurantRequest {
  locationId: string;
  priceCategory: PriceCategory;
  title: string;
  description?: string;
  phone: string;
  email?: string;
  openTime: string;
  closeTime: string;
  cuisineIds?: string[];
  isPublished?: boolean;
}

model UpdateRestaurantRequest {
  locationId?: string;
  priceCategory?: PriceCategory;
  title?: string;
  description?: string;
  phone?: string;
  email?: string;
  openTime?: string;
  closeTime?: string;
  cuisineIds?: string[];
}

model UpdateRestaurantPublicationRequest {
  isPublished: boolean;
}

model CreateRestaurantResponse {
  @statusCode statusCode: 201;
  data: RestaurantDetail;
}
