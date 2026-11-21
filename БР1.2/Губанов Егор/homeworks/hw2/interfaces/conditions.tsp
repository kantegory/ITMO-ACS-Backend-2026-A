import "@typespec/http";
import "../models/error.tsp";
import "../models/rental.tsp";

using Http;

namespace RentService;

@useAuth(BearerAuth)
@route("/api/v1/conditions")
@tag("Properties")
interface ConditionRoutes {
  @delete
  @route("/{id}")
  remove(@path id: string): void | UnauthorizedError | ForbiddenError | NotFoundError | ServerError;
}
