import "@typespec/http";
import "../models/restaurant.tsp";
import "../models/reservation.tsp";
import "../models/error.tsp";

using Http;

namespace RestaurantBookingApi;

@route("/api/v1/admin")
@tag("Admin")
interface AdminApi {
  @post
  @route("/locations")
  createLocation(
    @header("Authorization") authorization: string,
    @body body: CreateLocationRequest
  ): CreateLocationResponse | UnauthorizedError | ForbiddenError | ConflictError | ValidationError | ServerError;

  @patch(#{implicitOptionality: true})
  @route("/locations/{locationId}")
  updateLocation(
    @header("Authorization") authorization: string,
    @path locationId: string,
    @body body: UpdateLocationRequest
  ): LocationResponse | UnauthorizedError | ForbiddenError | NotFoundError | ConflictError | ValidationError | ServerError;

  @post
  @route("/restaurants")
  createRestaurant(
    @header("Authorization") authorization: string,
    @body body: CreateRestaurantRequest
  ): CreateRestaurantResponse | UnauthorizedError | ForbiddenError | ConflictError | ValidationError | ServerError;

  @patch(#{implicitOptionality: true})
  @route("/restaurants/{restaurantId}")
  updateRestaurant(
    @header("Authorization") authorization: string,
    @path restaurantId: string,
    @body body: UpdateRestaurantRequest
  ): RestaurantDetailResponse | UnauthorizedError | ForbiddenError | NotFoundError | ConflictError | ValidationError | ServerError;

  @patch(#{implicitOptionality: true})
  @route("/restaurants/{restaurantId}/publication")
  updateRestaurantPublication(
    @header("Authorization") authorization: string,
    @path restaurantId: string,
    @body body: UpdateRestaurantPublicationRequest
  ): RestaurantDetailResponse | UnauthorizedError | ForbiddenError | NotFoundError | ValidationError | ServerError;

  @post
  @route("/restaurants/{restaurantId}/tables")
  createTable(
    @header("Authorization") authorization: string,
    @path restaurantId: string,
    @body body: CreateRestaurantTableRequest
  ): CreateRestaurantTableResponse | UnauthorizedError | ForbiddenError | NotFoundError | ConflictError | ValidationError | ServerError;

  @patch(#{implicitOptionality: true})
  @route("/tables/{tableId}")
  updateTable(
    @header("Authorization") authorization: string,
    @path tableId: string,
    @body body: UpdateRestaurantTableRequest
  ): RestaurantTableResponse | UnauthorizedError | ForbiddenError | NotFoundError | ConflictError | ValidationError | ServerError;

  @post
  @route("/restaurants/{restaurantId}/menu-categories")
  createMenuCategory(
    @header("Authorization") authorization: string,
    @path restaurantId: string,
    @body body: CreateMenuCategoryRequest
  ): CreateMenuCategoryResponse | UnauthorizedError | ForbiddenError | NotFoundError | ConflictError | ValidationError | ServerError;

  @patch(#{implicitOptionality: true})
  @route("/menu-categories/{menuCategoryId}")
  updateMenuCategory(
    @header("Authorization") authorization: string,
    @path menuCategoryId: string,
    @body body: UpdateMenuCategoryRequest
  ): MenuCategoryResponse | UnauthorizedError | ForbiddenError | NotFoundError | ConflictError | ValidationError | ServerError;

  @post
  @route("/menu-categories/{menuCategoryId}/items")
  createMenuItem(
    @header("Authorization") authorization: string,
    @path menuCategoryId: string,
    @body body: CreateMenuItemRequest
  ): CreateMenuItemResponse | UnauthorizedError | ForbiddenError | NotFoundError | ConflictError | ValidationError | ServerError;

  @patch(#{implicitOptionality: true})
  @route("/menu-items/{menuItemId}")
  updateMenuItem(
    @header("Authorization") authorization: string,
    @path menuItemId: string,
    @body body: UpdateMenuItemRequest
  ): MenuItemResponse | UnauthorizedError | ForbiddenError | NotFoundError | ConflictError | ValidationError | ServerError;

  @post
  @route("/restaurants/{restaurantId}/photos")
  createPhoto(
    @header("Authorization") authorization: string,
    @path restaurantId: string,
    @body body: CreateRestaurantPhotoRequest
  ): CreateRestaurantPhotoResponse | UnauthorizedError | ForbiddenError | NotFoundError | ConflictError | ValidationError | ServerError;

  @patch(#{implicitOptionality: true})
  @route("/photos/{photoId}")
  updatePhoto(
    @header("Authorization") authorization: string,
    @path photoId: string,
    @body body: UpdateRestaurantPhotoRequest
  ): RestaurantPhotoResponse | UnauthorizedError | ForbiddenError | NotFoundError | ConflictError | ValidationError | ServerError;

  @patch(#{implicitOptionality: true})
  @route("/reservations/{reservationId}/status")
  updateReservationStatus(
    @header("Authorization") authorization: string,
    @path reservationId: string,
    @body body: UpdateReservationStatusRequest
  ): ReservationResponse | UnauthorizedError | ForbiddenError | NotFoundError | ConflictError | ValidationError | ServerError;
}
