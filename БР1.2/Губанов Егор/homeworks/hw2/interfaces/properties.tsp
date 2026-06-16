import "@typespec/http";
import "../models/error.tsp";
import "../models/rental.tsp";

using Http;

namespace RentService;

@route("/api/v1/properties")
@tag("Properties")
interface PublicProperties {
  @get
  @route("/")
  list(...PropertyListQuery): PropertyListResponse | ValidationError | ServerError;

  @get
  @route("/{id}")
  get(@path id: string): PropertyDetail | NotFoundError | ServerError;
}

@useAuth(BearerAuth)
@route("/api/v1/properties")
@tag("Properties")
interface OwnerProperties {
  @post
  @route("/")
  create(@body body: PropertyCreateBody): PropertyDetail | UnauthorizedError | ForbiddenError | ValidationError | NotFoundError | ServerError;

  @put
  @route("/{id}")
  update(@path id: string, @body body: PropertyUpdateBody): PropertyDetail | UnauthorizedError | ForbiddenError | NotFoundError | ValidationError | ServerError;

  @delete
  @route("/{id}")
  remove(@path id: string): void | UnauthorizedError | ForbiddenError | NotFoundError | ServerError;

  @post
  @route("/{propertyId}/photos")
  addPhoto(@path propertyId: string, @body body: PhotoCreateBody): PhotoOut | UnauthorizedError | ForbiddenError | NotFoundError | ValidationError | ServerError;

  @post
  @route("/{propertyId}/conditions")
  addCondition(@path propertyId: string, @body body: ConditionCreateBody): RentalConditionOut | UnauthorizedError | ForbiddenError | NotFoundError | ValidationError | ServerError;
}
