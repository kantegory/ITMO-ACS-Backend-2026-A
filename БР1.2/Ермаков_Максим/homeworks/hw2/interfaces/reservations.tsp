import "@typespec/http";
import "../models/reservation.tsp";
import "../models/error.tsp";

using Http;

namespace RestaurantBookingApi;

@route("/api/v1/reservations")
@tag("Reservations")
interface ReservationsApi {
  @get
  list(
    @header("Authorization") authorization: string,
    @query query?: ReservationListQuery
  ): ReservationListResponse | UnauthorizedError | ValidationError | ServerError;

  @post
  create(
    @header("Authorization") authorization: string,
    @body body: CreateReservationRequest
  ): CreateReservationResponse | UnauthorizedError | NotFoundError | ConflictError | ValidationError | ServerError;

  @get
  @route("/{reservationId}")
  getById(
    @header("Authorization") authorization: string,
    @path reservationId: string
  ): ReservationResponse | UnauthorizedError | ForbiddenError | NotFoundError | ServerError;

  @patch(#{implicitOptionality: true})
  @route("/{reservationId}")
  update(
    @header("Authorization") authorization: string,
    @path reservationId: string,
    @body body: UpdateReservationRequest
  ): ReservationResponse | UnauthorizedError | ForbiddenError | NotFoundError | ConflictError | ValidationError | ServerError;

  @post
  @route("/{reservationId}/cancel")
  cancel(
    @header("Authorization") authorization: string,
    @path reservationId: string,
    @body body: CancelReservationRequest
  ): ReservationResponse | UnauthorizedError | ForbiddenError | NotFoundError | ConflictError | ValidationError | ServerError;
}
