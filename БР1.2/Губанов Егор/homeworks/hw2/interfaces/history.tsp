import "@typespec/http";
import "../models/error.tsp";
import "../models/rental.tsp";

using Http;

namespace RentService;

@useAuth(BearerAuth)
@route("/api/v1/history")
@tag("History")
interface HistoryRoutes {
  @get
  @route("/")
  all(): HistoryResponse | UnauthorizedError | ServerError;
}
