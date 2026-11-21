import "@typespec/http";
import "../models/common.tsp";
import "../models/restaurant.tsp";
import "../models/error.tsp";

using Http;

namespace RestaurantBookingApi;

@route("/api/v1/reference")
@tag("Reference")
interface ReferenceApi {
  @get
  @route("/cuisines")
  listCuisines(): CuisineListResponse | ServerError;

  @get
  @route("/locations")
  listLocations(): LocationListResponse | ServerError;

  @get
  @route("/price-categories")
  listPriceCategories(): PriceCategoryListResponse | ServerError;

  @get
  @route("/reservation-statuses")
  listReservationStatuses(): ReservationStatusListResponse | ServerError;

  @get
  @route("/roles")
  listRoles(): UserRoleListResponse | ServerError;
}
