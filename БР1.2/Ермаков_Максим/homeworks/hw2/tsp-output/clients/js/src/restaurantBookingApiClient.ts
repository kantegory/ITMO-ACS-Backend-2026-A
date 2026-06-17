import { type AdminApiClientContext, type AdminApiClientOptions, createAdminApiClientContext } from "./api/adminApiClient/adminApiClientContext.js";
import { createLocation, type CreateLocationOptions, createMenuCategory, type CreateMenuCategoryOptions, createMenuItem, type CreateMenuItemOptions, createPhoto, type CreatePhotoOptions, createRestaurant, type CreateRestaurantOptions, createTable, type CreateTableOptions, updateLocation, type UpdateLocationOptions, updateMenuCategory, type UpdateMenuCategoryOptions, updateMenuItem, type UpdateMenuItemOptions, updatePhoto, type UpdatePhotoOptions, updateReservationStatus, type UpdateReservationStatusOptions, updateRestaurant, type UpdateRestaurantOptions, updateRestaurantPublication, type UpdateRestaurantPublicationOptions, updateTable, type UpdateTableOptions } from "./api/adminApiClient/adminApiClientOperations.js";
import { type AuthApiClientContext, type AuthApiClientOptions, createAuthApiClientContext } from "./api/authApiClient/authApiClientContext.js";
import { login, type LoginOptions, logout, type LogoutOptions, register, type RegisterOptions } from "./api/authApiClient/authApiClientOperations.js";
import { createReferenceApiClientContext, type ReferenceApiClientContext, type ReferenceApiClientOptions } from "./api/referenceApiClient/referenceApiClientContext.js";
import { listCuisines, type ListCuisinesOptions, listLocations, type ListLocationsOptions, listPriceCategories, type ListPriceCategoriesOptions, listReservationStatuses, type ListReservationStatusesOptions, listRoles, type ListRolesOptions } from "./api/referenceApiClient/referenceApiClientOperations.js";
import { createReservationsApiClientContext, type ReservationsApiClientContext, type ReservationsApiClientOptions } from "./api/reservationsApiClient/reservationsApiClientContext.js";
import { cancel, type CancelOptions, create, type CreateOptions, getById as getById_2, type GetByIdOptions as GetByIdOptions_2, list, type ListOptions, update, type UpdateOptions } from "./api/reservationsApiClient/reservationsApiClientOperations.js";
import { createRestaurantBookingApiClientContext, type RestaurantBookingApiClientContext, type RestaurantBookingApiClientOptions } from "./api/restaurantBookingApiClientContext.js";
import { createRestaurantsApiClientContext, type RestaurantsApiClientContext, type RestaurantsApiClientOptions } from "./api/restaurantsApiClient/restaurantsApiClientContext.js";
import { createReview, type CreateReviewOptions, getAvailability, type GetAvailabilityOptions, getById, type GetByIdOptions, getMenu, type GetMenuOptions, getPhotos, type GetPhotosOptions, getReviews, type GetReviewsOptions, search, type SearchOptions, updateReview, type UpdateReviewOptions } from "./api/restaurantsApiClient/restaurantsApiClientOperations.js";
import { createUsersApiClientContext, type UsersApiClientContext, type UsersApiClientOptions } from "./api/usersApiClient/usersApiClientContext.js";
import { getProfile, type GetProfileOptions, updateProfile, type UpdateProfileOptions } from "./api/usersApiClient/usersApiClientOperations.js";
import type { CancelReservationRequest, CreateLocationRequest, CreateMenuCategoryRequest, CreateMenuItemRequest, CreateReservationRequest, CreateRestaurantPhotoRequest, CreateRestaurantRequest, CreateRestaurantReviewRequest, CreateRestaurantTableRequest, LoginRequest, RegisterRequest, RestaurantAvailabilityQuery, UpdateLocationRequest, UpdateMenuCategoryRequest, UpdateMenuItemRequest, UpdateReservationRequest, UpdateReservationStatusRequest, UpdateRestaurantPhotoRequest, UpdateRestaurantPublicationRequest, UpdateRestaurantRequest, UpdateRestaurantReviewRequest, UpdateRestaurantTableRequest, UpdateUserProfileRequest } from "./models/models.js";

export class RestaurantBookingApiClient {
  #context: RestaurantBookingApiClientContext
  authApiClient: AuthApiClient;
  usersApiClient: UsersApiClient;
  referenceApiClient: ReferenceApiClient;
  restaurantsApiClient: RestaurantsApiClient;
  reservationsApiClient: ReservationsApiClient;
  adminApiClient: AdminApiClient
  constructor(options?: RestaurantBookingApiClientOptions) {
    this.#context = createRestaurantBookingApiClientContext(options);
    this.authApiClient = new AuthApiClient(options);;this.usersApiClient = new UsersApiClient(options);;this.referenceApiClient = new ReferenceApiClient(options);;this.restaurantsApiClient = new RestaurantsApiClient(options);;this.reservationsApiClient = new ReservationsApiClient(options);;this.adminApiClient = new AdminApiClient(options);
  }

}
export class AdminApiClient {
  #context: AdminApiClientContext

  constructor(options?: AdminApiClientOptions) {
    this.#context = createAdminApiClientContext(options);

  }
  async createLocation(
    authorization: string,
    body: CreateLocationRequest,
    options?: CreateLocationOptions,
  ) {
    return createLocation(this.#context, authorization, body, options);
  };
  async updateLocation(
    authorization: string,
    locationId: string,
    body: UpdateLocationRequest,
    options?: UpdateLocationOptions,
  ) {
    return updateLocation(
      this.#context,
      authorization,
      locationId,
      body,
      options
    );
  };
  async createRestaurant(
    authorization: string,
    body: CreateRestaurantRequest,
    options?: CreateRestaurantOptions,
  ) {
    return createRestaurant(this.#context, authorization, body, options);
  };
  async updateRestaurant(
    authorization: string,
    restaurantId: string,
    body: UpdateRestaurantRequest,
    options?: UpdateRestaurantOptions,
  ) {
    return updateRestaurant(
      this.#context,
      authorization,
      restaurantId,
      body,
      options
    );
  };
  async updateRestaurantPublication(
    authorization: string,
    restaurantId: string,
    body: UpdateRestaurantPublicationRequest,
    options?: UpdateRestaurantPublicationOptions,
  ) {
    return updateRestaurantPublication(
      this.#context,
      authorization,
      restaurantId,
      body,
      options
    );
  };
  async createTable(
    authorization: string,
    restaurantId: string,
    body: CreateRestaurantTableRequest,
    options?: CreateTableOptions,
  ) {
    return createTable(
      this.#context,
      authorization,
      restaurantId,
      body,
      options
    );
  };
  async updateTable(
    authorization: string,
    tableId: string,
    body: UpdateRestaurantTableRequest,
    options?: UpdateTableOptions,
  ) {
    return updateTable(this.#context, authorization, tableId, body, options);
  };
  async createMenuCategory(
    authorization: string,
    restaurantId: string,
    body: CreateMenuCategoryRequest,
    options?: CreateMenuCategoryOptions,
  ) {
    return createMenuCategory(
      this.#context,
      authorization,
      restaurantId,
      body,
      options
    );
  };
  async updateMenuCategory(
    authorization: string,
    menuCategoryId: string,
    body: UpdateMenuCategoryRequest,
    options?: UpdateMenuCategoryOptions,
  ) {
    return updateMenuCategory(
      this.#context,
      authorization,
      menuCategoryId,
      body,
      options
    );
  };
  async createMenuItem(
    authorization: string,
    menuCategoryId: string,
    body: CreateMenuItemRequest,
    options?: CreateMenuItemOptions,
  ) {
    return createMenuItem(
      this.#context,
      authorization,
      menuCategoryId,
      body,
      options
    );
  };
  async updateMenuItem(
    authorization: string,
    menuItemId: string,
    body: UpdateMenuItemRequest,
    options?: UpdateMenuItemOptions,
  ) {
    return updateMenuItem(
      this.#context,
      authorization,
      menuItemId,
      body,
      options
    );
  };
  async createPhoto(
    authorization: string,
    restaurantId: string,
    body: CreateRestaurantPhotoRequest,
    options?: CreatePhotoOptions,
  ) {
    return createPhoto(
      this.#context,
      authorization,
      restaurantId,
      body,
      options
    );
  };
  async updatePhoto(
    authorization: string,
    photoId: string,
    body: UpdateRestaurantPhotoRequest,
    options?: UpdatePhotoOptions,
  ) {
    return updatePhoto(this.#context, authorization, photoId, body, options);
  };
  async updateReservationStatus(
    authorization: string,
    reservationId: string,
    body: UpdateReservationStatusRequest,
    options?: UpdateReservationStatusOptions,
  ) {
    return updateReservationStatus(
      this.#context,
      authorization,
      reservationId,
      body,
      options
    );
  }
}
export class ReservationsApiClient {
  #context: ReservationsApiClientContext

  constructor(options?: ReservationsApiClientOptions) {
    this.#context = createReservationsApiClientContext(options);

  }
  async list(authorization: string, options?: ListOptions) {
    return list(this.#context, authorization, options);
  };
  async create(
    authorization: string,
    body: CreateReservationRequest,
    options?: CreateOptions,
  ) {
    return create(this.#context, authorization, body, options);
  };
  async getById(
    authorization: string,
    reservationId: string,
    options?: GetByIdOptions_2,
  ) {
    return getById_2(this.#context, authorization, reservationId, options);
  };
  async update(
    authorization: string,
    reservationId: string,
    body: UpdateReservationRequest,
    options?: UpdateOptions,
  ) {
    return update(this.#context, authorization, reservationId, body, options);
  };
  async cancel(
    authorization: string,
    reservationId: string,
    body: CancelReservationRequest,
    options?: CancelOptions,
  ) {
    return cancel(this.#context, authorization, reservationId, body, options);
  }
}
export class RestaurantsApiClient {
  #context: RestaurantsApiClientContext

  constructor(options?: RestaurantsApiClientOptions) {
    this.#context = createRestaurantsApiClientContext(options);

  }
  async search(options?: SearchOptions) {
    return search(this.#context, options);
  };
  async getById(restaurantId: string, options?: GetByIdOptions) {
    return getById(this.#context, restaurantId, options);
  };
  async getMenu(restaurantId: string, options?: GetMenuOptions) {
    return getMenu(this.#context, restaurantId, options);
  };
  async getPhotos(restaurantId: string, options?: GetPhotosOptions) {
    return getPhotos(this.#context, restaurantId, options);
  };
  async getReviews(restaurantId: string, options?: GetReviewsOptions) {
    return getReviews(this.#context, restaurantId, options);
  };
  async createReview(
    authorization: string,
    restaurantId: string,
    body: CreateRestaurantReviewRequest,
    options?: CreateReviewOptions,
  ) {
    return createReview(
      this.#context,
      authorization,
      restaurantId,
      body,
      options
    );
  };
  async updateReview(
    authorization: string,
    restaurantId: string,
    reviewId: string,
    body: UpdateRestaurantReviewRequest,
    options?: UpdateReviewOptions,
  ) {
    return updateReview(
      this.#context,
      authorization,
      restaurantId,
      reviewId,
      body,
      options
    );
  };
  async getAvailability(
    restaurantId: string,
    query: RestaurantAvailabilityQuery,
    options?: GetAvailabilityOptions,
  ) {
    return getAvailability(this.#context, restaurantId, query, options);
  }
}
export class ReferenceApiClient {
  #context: ReferenceApiClientContext

  constructor(options?: ReferenceApiClientOptions) {
    this.#context = createReferenceApiClientContext(options);

  }
  async listCuisines(options?: ListCuisinesOptions) {
    return listCuisines(this.#context, options);
  };
  async listLocations(options?: ListLocationsOptions) {
    return listLocations(this.#context, options);
  };
  async listPriceCategories(options?: ListPriceCategoriesOptions) {
    return listPriceCategories(this.#context, options);
  };
  async listReservationStatuses(options?: ListReservationStatusesOptions) {
    return listReservationStatuses(this.#context, options);
  };
  async listRoles(options?: ListRolesOptions) {
    return listRoles(this.#context, options);
  }
}
export class UsersApiClient {
  #context: UsersApiClientContext

  constructor(options?: UsersApiClientOptions) {
    this.#context = createUsersApiClientContext(options);

  }
  async getProfile(authorization: string, options?: GetProfileOptions) {
    return getProfile(this.#context, authorization, options);
  };
  async updateProfile(
    authorization: string,
    body: UpdateUserProfileRequest,
    options?: UpdateProfileOptions,
  ) {
    return updateProfile(this.#context, authorization, body, options);
  }
}
export class AuthApiClient {
  #context: AuthApiClientContext

  constructor(options?: AuthApiClientOptions) {
    this.#context = createAuthApiClientContext(options);

  }
  async register(body: RegisterRequest, options?: RegisterOptions) {
    return register(this.#context, body, options);
  };
  async login(body: LoginRequest, options?: LoginOptions) {
    return login(this.#context, body, options);
  };
  async logout(authorization: string, options?: LogoutOptions) {
    return logout(this.#context, authorization, options);
  }
}