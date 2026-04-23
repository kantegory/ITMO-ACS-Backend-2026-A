import "@typespec/http";
import "../models/error.tsp";
import "../models/rental.tsp";

using Http;

namespace RentService;

@useAuth(BearerAuth)
@route("/api/v1/me")
@tag("Me")
interface MeRoutes {
  @get
  @route("/")
  profile(): UserPublic | UnauthorizedError | ServerError;

  @get
  @route("/renting")
  renting(): RentingResponse | UnauthorizedError | ServerError;

  @get
  @route("/owning")
  owning(): OwningResponse | UnauthorizedError | ServerError;

  @get
  @route("/owning/deals")
  owningDeals(): DealListResponse | UnauthorizedError | ServerError;
}
