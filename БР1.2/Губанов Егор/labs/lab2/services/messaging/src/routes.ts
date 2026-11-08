import { Router } from "express";
import { wrap } from "../../../packages/shared/src/wrap";
import { requireAuth } from "../../../packages/shared/src/authMiddleware";
import { internalOnly } from "./middleware/internal";
import * as msg from "./controllers/messagesController";
import * as internal from "./controllers/internalController";

export function buildRoutes() {
  const r = Router();

  r.get(["/messages", "/messages/"], requireAuth, wrap(msg.list));
  r.post(["/messages", "/messages/"], requireAuth, wrap(msg.send));
  r.patch("/messages/:id/read", requireAuth, wrap(msg.markRead));

  r.get(
    "/internal/v1/users/:userId/messages",
    internalOnly,
    wrap(internal.userMessagesHistory)
  );

  return r;
}
