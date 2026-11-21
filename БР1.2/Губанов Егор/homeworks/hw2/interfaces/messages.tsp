import "@typespec/http";
import "../models/error.tsp";
import "../models/rental.tsp";

using Http;

namespace RentService;

@useAuth(BearerAuth)
@route("/api/v1/messages")
@tag("Messages")
interface MessageRoutes {
  @get
  @route("/")
  list(...MessageListQuery): MessageListResponse | UnauthorizedError | ValidationError | ServerError;

  @post
  @route("/")
  send(@body body: MessageCreateBody): MessageOut | UnauthorizedError | ForbiddenError | ValidationError | NotFoundError | ServerError;

  @patch
  @route("/{id}/read")
  markRead(@path id: string): MessageOut | UnauthorizedError | NotFoundError | ServerError;
}
