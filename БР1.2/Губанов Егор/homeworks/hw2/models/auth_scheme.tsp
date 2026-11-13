import "@typespec/http";

using Http;

namespace RentService;

model BearerAuth is Http.BearerAuth;
