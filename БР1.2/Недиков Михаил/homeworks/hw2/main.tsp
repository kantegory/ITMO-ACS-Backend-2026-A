import "@typespec/http";
import "@typespec/openapi3";

import "./models.tsp";
import "./endpoints.tsp";

using TypeSpec.Http;

@service(#{
  title: "Rental Service API"
})

@server("http://localhost:8000", "local")

namespace RentalService;



