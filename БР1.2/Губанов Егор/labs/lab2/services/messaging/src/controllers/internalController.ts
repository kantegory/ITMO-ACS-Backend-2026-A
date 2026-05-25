import { Request, Response } from "express";
import { Brackets } from "typeorm";
import { AppDataSource } from "../data-source";
import { Message } from "../entities/Message";
import { messageOut } from "../serializers";

export async function userMessagesHistory(req: Request, res: Response) {
  const userId = req.params.userId;
  const limit = Math.min(
    200,
    parseInt(String(req.query.limit || "200"), 10) || 200
  );
  const messages = await AppDataSource.getRepository(Message)
    .createQueryBuilder("m")
    .where(
      new Brackets((qb) => {
        qb.where("m.senderId = :uid", { uid: userId }).orWhere(
          "m.receiverId = :uid",
          { uid: userId }
        );
      })
    )
    .orderBy("m.createdAt", "DESC")
    .take(limit)
    .getMany();
  res.json({ items: messages.map(messageOut) });
}
