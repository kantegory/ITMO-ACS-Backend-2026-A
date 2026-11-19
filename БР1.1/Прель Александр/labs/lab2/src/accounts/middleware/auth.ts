import "../../shared/auth";
import { asyncHandler } from "../../shared/async-handler";
import { unauthorized } from "../../shared/errors";
import { AppDataSource } from "../data-source";
import { User } from "../entities";
import { verifyAccessToken } from "../utils/jwt";
import { toUserResponse } from "../utils/serializers";

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) throw unauthorized();
  const payload = verifyAccessToken(authorization.slice(7));
  const user = await AppDataSource.getRepository(User).findOneBy({ userId: payload.userId });
  if (!user) throw unauthorized();
  req.user = toUserResponse(user);
  next();
});
