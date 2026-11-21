import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Message } from "../entities/Message";
import { Deal } from "../entities/Deal";
import { messageOut, dealOut } from "../serializers";

export async function all(req: Request, res: Response) {
  const uid = req.user!.id;
  const msgRepo = AppDataSource.getRepository(Message);
  const messages = await msgRepo
    .createQueryBuilder("m")
    .where("m.sender_id = :uid OR m.receiver_id = :uid", { uid })
    .orderBy("m.created_at", "DESC")
    .take(200)
    .getMany();
  const dealRepo = AppDataSource.getRepository(Deal);
  const deals = await dealRepo
    .createQueryBuilder("d")
    .leftJoinAndSelect("d.property", "p")
    .where("(d.tenant_id = :uid OR p.owner_id = :uid)", { uid })
    .orderBy("d.created_at", "DESC")
    .take(200)
    .getMany();
  res.json({
    messages: messages.map(messageOut),
    deals: deals.map((d) => dealOut(d, d.property)),
  });
}
