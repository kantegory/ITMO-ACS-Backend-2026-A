import "@typespec/http";
import "../models/error.tsp";
import "../models/rental.tsp";

using Http;

namespace RentService;

@useAuth(BearerAuth)
@route("/api/v1/deals")
@tag("Deals")
interface DealRoutes {
  @post
  @route("/")
  create(@body body: DealCreateBody): DealOut | UnauthorizedError | ForbiddenError | ValidationError | ConflictError | NotFoundError | ServerError;

  @get
  @route("/{id}")
  get(@path id: string): DealOut | UnauthorizedError | ForbiddenError | NotFoundError | ServerError;

  @patch
  @route("/{id}")
  patch(@path id: string, @body body: DealPatchBody): DealOut | UnauthorizedError | ForbiddenError | NotFoundError | ConflictError | ValidationError | ServerError;
}
