import "@typespec/http";
import "./models/error.tsp";
import "./models/auth_scheme.tsp";
import "./models/rental.tsp";
import "./interfaces/auth.tsp";
import "./interfaces/me.tsp";
import "./interfaces/property_types.tsp";
import "./interfaces/properties.tsp";
import "./interfaces/conditions.tsp";
import "./interfaces/photos.tsp";
import "./interfaces/deals.tsp";
import "./interfaces/messages.tsp";
import "./interfaces/history.tsp";

using Http;

@service({ title: "Rent service" })
@server("http://localhost:3000", "ЛР1 API")
namespace RentService;
