import "@typespec/http";
import "../models/error.tsp";

using Http;

namespace RentService;

@useAuth(BearerAuth)
@route("/api/v1/photos")
@tag("Properties")
interface PhotoRoutes {
  @delete
  @route("/{id}")
  remove(@path id: string): void | UnauthorizedError | ForbiddenError | NotFoundError | ServerError;
}
