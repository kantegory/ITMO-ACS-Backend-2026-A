import { Request, Response } from "express";
import { Brackets } from "typeorm";
import { AppDataSource } from "../data-source";
import { Message } from "../entities/Message";
import { Deal } from "../entities/Deal";
import { messageOut, dealOut } from "../serializers";

export async function all(req: Request, res: Response) {
  const uid = req.user!.id;
  const msgRepo = AppDataSource.getRepository(Message);
  const messages = await msgRepo
    .createQueryBuilder("m")
    .where(
      new Brackets((qb) => {
        qb.where("m.senderId = :uid", { uid }).orWhere("m.receiverId = :uid", {
          uid,
        });
      })
    )
    .orderBy("m.createdAt", "DESC")
    .take(200)
    .getMany();
  const dealRepo = AppDataSource.getRepository(Deal);
  const deals = await dealRepo
    .createQueryBuilder("d")
    .leftJoinAndSelect("d.property", "p")
    .where(
      new Brackets((qb) => {
        qb.where("d.tenantId = :uid", { uid }).orWhere("p.ownerId = :uid", {
          uid,
        });
      })
    )
    .orderBy("d.createdAt", "DESC")
    .take(200)
    .getMany();
  res.json({
    messages: messages.map(messageOut),
    deals: deals.map((d) => dealOut(d, d.property)),
  });
}
