import bcrypt from "bcryptjs";
import express from "express";
import { z } from "zod";
import {
  asyncHandler,
  authRequired,
  errorHandler,
  health,
  HttpError,
  notFound,
  signAccessToken,
  validate,
} from "@fitflow/shared";
import { dataSource } from "./data-source.js";
import { User } from "./entity.js";

const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72),
});
const registerBody = credentials.extend({
  name: z.string().trim().min(2).max(100),
});

function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "64kb" }));
  app.get("/health", (_req, res) => res.json(health("auth")));

  app.post(
    "/auth/register",
    asyncHandler(async (req, res) => {
      const body = validate(registerBody, req.body);
      const users = dataSource.getRepository(User);
      if (await users.existsBy({ email: body.email }))
        throw new HttpError(409, "Email is already registered", "EMAIL_TAKEN");
      const user = users.create({
        email: body.email,
        name: body.name,
        passwordHash: await bcrypt.hash(body.password, 12),
        role: "user",
      });
      await users.save(user);
      res.status(201).json({
        user: publicUser(user),
        accessToken: signAccessToken({
          sub: user.id,
          email: user.email,
          role: user.role,
        }),
      });
    }),
  );

  app.post(
    "/auth/login",
    asyncHandler(async (req, res) => {
      const body = validate(credentials, req.body);
      const user = await dataSource
        .getRepository(User)
        .findOneBy({ email: body.email });
      if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
        throw new HttpError(
          401,
          "Email or password is incorrect",
          "INVALID_CREDENTIALS",
        );
      }
      res.json({
        user: publicUser(user),
        accessToken: signAccessToken({
          sub: user.id,
          email: user.email,
          role: user.role,
        }),
      });
    }),
  );

  app.get(
    "/auth/me",
    authRequired,
    asyncHandler(async (req, res) => {
      const user = await dataSource
        .getRepository(User)
        .findOneBy({ id: req.auth!.sub });
      if (!user)
        throw new HttpError(404, "User was not found", "USER_NOT_FOUND");
      res.json(publicUser(user));
    }),
  );

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
