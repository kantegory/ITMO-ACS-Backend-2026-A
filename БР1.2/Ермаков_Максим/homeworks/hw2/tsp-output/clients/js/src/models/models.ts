/**
 * A sequence of textual characters.
 */
export type String = string;
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
}
export interface AuthPayload {
  user: AuthUser;
  tokens: AuthTokenPayload;
}
export interface AuthUser {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
export enum UserRole {
  Admin = "ADMIN",
  User = "USER"
}
/**
 * Boolean with `true` and `false` values.
 */
export type Boolean = boolean;
export interface AuthTokenPayload {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}
/**
 * A 32-bit integer. (`-2,147,483,648` to `2,147,483,647`)
 */
export type Int32 = number;
/**
 * A 64-bit integer. (`-9,223,372,036,854,775,808` to `9,223,372,036,854,775,807`)
 */
export type Int64 = bigint;
/**
 * A whole number. This represent any `integer` value possible.
 * It is commonly represented as `BigInteger` in some languages.
 */
export type Integer = number;
/**
 * A numeric type
 */
export type Numeric = number;
export interface LoginRequest {
  email: string;
  password: string;
}
export interface LoginResponse {
  data: AuthPayload;
}
export interface ActionSuccessResponse {
  message: string;
}
export interface UserProfileResponse {
  data: UserProfile;
}
export interface UserProfile {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface UpdateUserProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  currentPassword?: string;
  password?: string;
}
export interface CuisineListResponse {
  data: Array<Cuisine>;
}

export interface Cuisine {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
export interface LocationListResponse {
  data: Array<Location>;
}

export interface Location {
  id: string;
  city: string;
  address: string;
  district?: string;
  metroStation?: string;
  createdAt: string;
  updatedAt: string;
}
export interface PriceCategoryListResponse {
  data: Array<PriceCategoryItem>;
}

export interface PriceCategoryItem {
  code: PriceCategory;
  label: string;
}
export enum PriceCategory {
  Low = "LOW",
  Medium = "MEDIUM",
  High = "HIGH"
}
export interface ReservationStatusListResponse {
  data: Array<ReservationStatusItem>;
}

export interface ReservationStatusItem {
  code: ReservationStatus;
  label: string;
}
export enum ReservationStatus {
  Pending = "PENDING",
  Confirmed = "CONFIRMED",
  Cancelled = "CANCELLED",
  Completed = "COMPLETED"
}
export interface UserRoleListResponse {
  data: Array<RoleItem>;
}

export interface RoleItem {
  code: UserRole;
  label: string;
}
export interface SearchRestaurantsQuery {
  city?: string;
  district?: string;
  metroStation?: string;
  cuisineId?: string;
  priceCategory?: PriceCategory;
  reservationDate?: string;
  reservationTime?: string;
  guestsCount?: number;
  page?: number;
  limit?: number;
}
export interface RestaurantListResponse {
  data: Array<RestaurantCard>;
  meta: PaginationMeta;
}

export interface RestaurantCard {
  id: string;
  title: string;
  description?: string;
  phone: string;
  email?: string;
  openTime: string;
  closeTime: string;
  avgRating: number;
  priceCategory: PriceCategory;
  location: Location;
  cuisines: Array<Cuisine>;
  mainPhoto?: RestaurantPhoto;
}
/**
 * A 32 bit floating point number. (`±1.5 x 10^−45` to `±3.4 x 10^38`)
 */
export type Float32 = number;
/**
 * A 64 bit floating point number. (`±5.0 × 10^−324` to `±1.7 × 10^308`)
 */
export type Float64 = number;
/**
 * A number with decimal value
 */
export type Float = number;
export interface RestaurantPhoto {
  id: string;
  imageUrl: string;
  isMain: boolean;
  createdAt: string;
}
export interface RestaurantDetail extends RestaurantCard {
  isPublished: boolean;
  tables: Array<RestaurantTable>;
  photos: Array<RestaurantPhoto>;
  menu: Array<MenuCategory>;
  reviewsSummary: ReviewsSummary;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}


export interface MenuCategory {
  id: string;
  restaurantId: string;
  title: string;
  items: Array<MenuItem>;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  title: string;
  description?: string;
  price: number;
  weight?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface ReviewsSummary {
  totalReviews: number;
  avgRating: number;
}
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}
export interface RestaurantDetailResponse {
  data: RestaurantDetail;
}
export interface RestaurantMenuResponse {
  restaurantId: string;
  data: Array<MenuCategory>;
}
export interface RestaurantPhotoListResponse {
  restaurantId: string;
  data: Array<RestaurantPhoto>;
}
export interface RestaurantReviewListQuery {
  page?: number;
  limit?: number;
}
export interface RestaurantReviewListResponse {
  data: Array<RestaurantReview>;
  meta: PaginationMeta;
}

export interface RestaurantReview {
  id: string;
  user: ReviewAuthor;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}
export interface ReviewAuthor {
  id: string;
  firstName: string;
  lastName: string;
}
export interface CreateRestaurantReviewRequest {
  rating: number;
  comment: string;
}
export interface UpdateRestaurantReviewRequest {
  rating?: number;
  comment?: string;
}
export interface RestaurantReviewResponse {
  data: RestaurantReview;
}
export interface RestaurantAvailabilityQuery {
  reservationDate: string;
  reservationTime: string;
  guestsCount: number;
}
export interface RestaurantAvailabilityResponse {
  restaurantId: string;
  reservationDate: string;
  reservationTime: string;
  guestsCount: number;
  data: Array<AvailableTable>;
}

export interface AvailableTable {
  id: string;
  tableNumber: string;
  capacity: number;
}
export interface ReservationListQuery {
  status?: ReservationStatus;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}
export interface ReservationListResponse {
  data: Array<Reservation>;
  meta: PaginationMeta;
}

export interface Reservation {
  id: string;
  user: ReservationUserInfo;
  restaurant: ReservationRestaurantInfo;
  table: ReservationTableInfo;
  status: ReservationStatus;
  reservationDate: string;
  reservationTime: string;
  guestsCount: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}
export interface ReservationUserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}
export interface ReservationRestaurantInfo {
  id: string;
  title: string;
  location: Location;
}
export interface ReservationTableInfo {
  id: string;
  tableNumber: string;
  capacity: number;
}
export interface CreateReservationRequest {
  restaurantId: string;
  tableId: string;
  reservationDate: string;
  reservationTime: string;
  guestsCount: number;
  comment?: string;
}
export interface ReservationResponse {
  data: Reservation;
}
export interface UpdateReservationRequest {
  tableId?: string;
  reservationDate?: string;
  reservationTime?: string;
  guestsCount?: number;
  comment?: string;
}
export interface CancelReservationRequest {
  reason?: string;
}
export interface CreateLocationRequest {
  city: string;
  address: string;
  district?: string;
  metroStation?: string;
}
export interface UpdateLocationRequest {
  city?: string;
  address?: string;
  district?: string;
  metroStation?: string;
}
export interface LocationResponse {
  data: Location;
}
export interface CreateRestaurantRequest {
  locationId: string;
  priceCategory: PriceCategory;
  title: string;
  description?: string;
  phone: string;
  email?: string;
  openTime: string;
  closeTime: string;
  cuisineIds?: Array<string>;
  isPublished?: boolean;
}

export interface UpdateRestaurantRequest {
  locationId?: string;
  priceCategory?: PriceCategory;
  title?: string;
  description?: string;
  phone?: string;
  email?: string;
  openTime?: string;
  closeTime?: string;
  cuisineIds?: Array<string>;
}
export interface UpdateRestaurantPublicationRequest {
  isPublished: boolean;
}
export interface CreateRestaurantTableRequest {
  tableNumber: string;
  capacity: number;
  isActive?: boolean;
}
export interface UpdateRestaurantTableRequest {
  tableNumber?: string;
  capacity?: number;
  isActive?: boolean;
}
export interface RestaurantTableResponse {
  data: RestaurantTable;
}
export interface CreateMenuCategoryRequest {
  title: string;
}
export interface UpdateMenuCategoryRequest {
  title?: string;
}
export interface MenuCategoryResponse {
  data: MenuCategory;
}
export interface CreateMenuItemRequest {
  title: string;
  description?: string;
  price: number;
  weight?: string;
  isAvailable?: boolean;
}
export interface UpdateMenuItemRequest {
  title?: string;
  description?: string;
  price?: number;
  weight?: string;
  isAvailable?: boolean;
}
export interface MenuItemResponse {
  data: MenuItem;
}
export interface CreateRestaurantPhotoRequest {
  imageUrl: string;
  isMain?: boolean;
}
export interface UpdateRestaurantPhotoRequest {
  imageUrl?: string;
  isMain?: boolean;
}
export interface RestaurantPhotoResponse {
  data: RestaurantPhoto;
}
export interface UpdateReservationStatusRequest {
  status: ReservationStatus;
}