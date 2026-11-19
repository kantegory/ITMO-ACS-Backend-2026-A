import { Router } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities";
import { conflict, ValidationErrorDetail } from "../errors";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/async-handler";
import { toUserResponse } from "../utils/serializers";
import { asString, ensureValid, isEmail, isPhone } from "../utils/validation";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    res.json(toUserResponse(req.user!));
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

    const firstName = req.body.firstName === undefined ? undefined : asString(req.body.firstName);
    const lastName = req.body.lastName === undefined ? undefined : asString(req.body.lastName);
    const email = req.body.email === undefined ? undefined : asString(req.body.email)?.toLowerCase();
    const phone = req.body.phone === undefined ? undefined : asString(req.body.phone);

    if (req.body.firstName !== undefined && !firstName) {
      details.push({ field: "firstName", message: "Имя не может быть пустым." });
    }
    if (req.body.lastName !== undefined && !lastName) {
      details.push({ field: "lastName", message: "Фамилия не может быть пустой." });
    }
    if (email !== undefined && !isEmail(email)) {
      details.push({ field: "email", message: "Некорректный email." });
    }
    if (phone !== undefined && !isPhone(phone)) {
      details.push({ field: "phone", message: "Некорректный номер телефона." });
    }
    ensureValid(details);

    const userRepository = AppDataSource.getRepository(User);
    const user = req.user!;

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

    const savedUser = await userRepository.save(user);
    res.json(toUserResponse(savedUser));
  }),
);
