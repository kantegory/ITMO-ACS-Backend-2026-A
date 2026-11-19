import bcrypt from "bcryptjs";
import { Router } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities";
import { conflict, unauthorized, ValidationErrorDetail } from "../errors";
import { asyncHandler } from "../utils/async-handler";
import { signAccessToken, tokenExpiresInSeconds } from "../utils/jwt";
import { toUserResponse } from "../utils/serializers";
import {
  ensureValid,
  validateEmail,
  validatePassword,
  validatePhone,
  validateRequiredString,
} from "../utils/validation";

export const authRouter = Router();

const buildAuthResponse = (user: User) => ({
  accessToken: signAccessToken({ userId: user.userId }),
  tokenType: "Bearer",
  expiresIn: tokenExpiresInSeconds(),
  user: toUserResponse(user),
});

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const details: ValidationErrorDetail[] = [];
    const firstName = validateRequiredString(details, req.body.firstName, "firstName", 100);
    const lastName = validateRequiredString(details, req.body.lastName, "lastName", 100);
    const email = validateEmail(details, req.body.email);
    const phone = validatePhone(details, req.body.phone);
    const password = validatePassword(details, req.body.password);
    ensureValid(details);

    const userRepository = AppDataSource.getRepository(User);
    const existingUser = await userRepository.findOneBy({ email });
    if (existingUser) {
      throw conflict("Пользователь с таким email уже существует.");
    }

    const user = await userRepository.save(
      userRepository.create({
        firstName,
        lastName,
        email,
        phone,
        passwordHash: await bcrypt.hash(password, 10),
      }),
    );

    res.status(201).json(buildAuthResponse(user));
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const details: ValidationErrorDetail[] = [];
    const email = validateEmail(details, req.body.email);
    const password = validatePassword(details, req.body.password);
    ensureValid(details);

    const user = await AppDataSource.getRepository(User).findOneBy({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw unauthorized("Неверный email или пароль.");
    }

    res.json(buildAuthResponse(user));
  }),
);
