import "@typespec/http";
import "../models/restaurant.tsp";
import "../models/error.tsp";

using Http;

namespace RestaurantBookingApi;

@route("/api/v1/restaurants")
@tag("Restaurants")
interface RestaurantsApi {
  @get
  search(@query filters?: SearchRestaurantsQuery): RestaurantListResponse | ValidationError | ServerError;

  @get
  @route("/{restaurantId}")
  getById(@path restaurantId: string): RestaurantDetailResponse | NotFoundError | ServerError;

  @get
  @route("/{restaurantId}/menu")
  getMenu(@path restaurantId: string): RestaurantMenuResponse | NotFoundError | ServerError;

  @get
  @route("/{restaurantId}/photos")
  getPhotos(@path restaurantId: string): RestaurantPhotoListResponse | NotFoundError | ServerError;

  @get
  @route("/{restaurantId}/reviews")
  getReviews(
    @path restaurantId: string,
    @query query?: RestaurantReviewListQuery
  ): RestaurantReviewListResponse | NotFoundError | ValidationError | ServerError;

  @post
  @route("/{restaurantId}/reviews")
  createReview(
    @header("Authorization") authorization: string,
    @path restaurantId: string,
    @body body: CreateRestaurantReviewRequest
  ): CreateRestaurantReviewResponse | UnauthorizedError | NotFoundError | ConflictError | ValidationError | ServerError;

  @patch(#{implicitOptionality: true})
  @route("/{restaurantId}/reviews/{reviewId}")
  updateReview(
    @header("Authorization") authorization: string,
    @path restaurantId: string,
    @path reviewId: string,
    @body body: UpdateRestaurantReviewRequest
  ): RestaurantReviewResponse | UnauthorizedError | ForbiddenError | NotFoundError | ValidationError | ServerError;

  @get
  @route("/{restaurantId}/availability")
  getAvailability(
    @path restaurantId: string,
    @query query: RestaurantAvailabilityQuery
  ): RestaurantAvailabilityResponse | NotFoundError | ValidationError | ServerError;
}
