import "@typespec/http";
import "../models/error.tsp";
import "../models/rental.tsp";

using Http;

namespace RentService;

@route("/api/v1/property-types")
@tag("Property types")
interface PropertyTypeRoutes {
  @get
  @route("/")
  list(): PropertyTypeOut[] | ServerError;
}
