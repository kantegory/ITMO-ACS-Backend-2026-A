import "@typespec/http";
import "./interfaces/auth.tsp";
import "./interfaces/users.tsp";
import "./interfaces/reference.tsp";
import "./interfaces/restaurants.tsp";
import "./interfaces/reservations.tsp";
import "./interfaces/admin.tsp";

using Http;

@service(#{title: "Restaurant Booking API"})
@server("/", "")
namespace RestaurantBookingApi;
