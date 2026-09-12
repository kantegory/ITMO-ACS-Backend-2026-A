import { Router } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities";
import { conflict, ValidationErrorDetail } from "../../shared/errors";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../../shared/async-handler";
import { toUserResponse } from "../utils/serializers";
import { ensureValid, validateEmail, validatePhone, validateRequiredString } from "../../shared/validation";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    res.json(req.user!);
  }),
);

usersRouter.patch(
  "/me",
  asyncHandler(async (req, res) => {
    const details: ValidationErrorDetail[] = [];
    const allowedFields = ["firstName", "lastName", "email", "phone"];
    const hasPayload = allowedFields.some((field) => req.body[field] !== undefined);

    if (!hasPayload) {
      details.push({ field: "body", message: "Нужно передать хотя бы одно поле для обновления." });
    }

    const firstName = req.body.firstName === undefined ? undefined : validateRequiredString(details, req.body.firstName, "firstName", 100);
    const lastName = req.body.lastName === undefined ? undefined : validateRequiredString(details, req.body.lastName, "lastName", 100);
    const email = req.body.email === undefined ? undefined : validateEmail(details, req.body.email);
    const phone = req.body.phone === undefined ? undefined : validatePhone(details, req.body.phone);
    ensureValid(details);

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneByOrFail({ userId: req.user!.userId });

    if (email && email !== user.email) {
      const existingUser = await userRepository.findOneBy({ email });
      if (existingUser) {
        throw conflict("Пользователь с таким email уже существует.");
      }
      user.email = email;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;

    const savedUser = await userRepository.save(user, { transaction: false });
    res.json(toUserResponse(savedUser));
  }),
);
