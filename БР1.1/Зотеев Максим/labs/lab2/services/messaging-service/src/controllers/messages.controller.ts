import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Message } from "../entities/Message";
import { badRequest, forbidden, HttpError, notFound, parseNumericId } from "@rental/shared";
import { toMessage } from "../utils/mappers";
import { parsePagination, buildPageResponse } from "../utils/pagination";
import * as rentalClient from "../clients/rental";
import * as identityClient from "../clients/identity";

const messagesRepo = () => AppDataSource.getRepository(Message);

const ensureRentalAccess = async (rentalId: string, userId: string) => {
  let participants;
  try {
    participants = await rentalClient.getRentalParticipants(rentalId);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) throw notFound("Сделка не найдена");
    throw e;
  }
  if (participants.tenant_id !== userId && participants.owner_id !== userId) {
    throw forbidden("Нет доступа к сообщениям этой сделки");
  }
  return participants;
};

export const getRentalMessages = async (req: Request, res: Response) => {
  const rentalId = parseNumericId(req.params.id, "rentalId");
  await ensureRentalAccess(rentalId, req.user!.sub);
  const { page, size, skip } = parsePagination(req.query);
  const [rows, total] = await messagesRepo().findAndCount({
    where: { rentalId },
    order: { createdAt: "ASC" },
    skip,
    take: size,
  });
  const senderIds = rows.map((m) => m.senderId).filter((id): id is string => !!id);
  const users = senderIds.length
    ? await identityClient.batchGetUsers(Array.from(new Set(senderIds))).catch(() => undefined)
    : undefined;
  res.json(buildPageResponse(rows.map((m) => toMessage(m, users)), total, page, size));
};

export const sendMessage = async (req: Request, res: Response) => {
  const rentalId = parseNumericId(req.params.id, "rentalId");
  await ensureRentalAccess(rentalId, req.user!.sub);
  const { body } = req.body ?? {};
  if (!body || typeof body !== "string" || !body.trim()) throw badRequest("Пустое сообщение", "empty_body");
  const msg = messagesRepo().create({
    rentalId,
    senderId: req.user!.sub,
    kind: "user",
    body,
  });
  await messagesRepo().save(msg);
  const users = await identityClient.batchGetUsers([req.user!.sub]).catch(() => undefined);
  res.status(201).json(toMessage(msg, users));
};
