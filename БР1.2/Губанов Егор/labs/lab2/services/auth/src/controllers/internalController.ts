import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { E } from "../../../../packages/shared/src/errors";
import { userBrief } from "../serializers";

export async function getUserBrief(req: Request, res: Response) {
  const user = await AppDataSource.getRepository(User).findOne({
    where: { id: req.params.id },
  });
  if (!user) throw E.notFound();
  res.json(userBrief(user));
}
