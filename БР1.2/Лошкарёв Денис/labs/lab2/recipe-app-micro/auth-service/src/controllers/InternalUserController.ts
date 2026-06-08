import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { User } from "../entities/User";

export class InternalUserController {
    private static repo = AppDataSource.getRepository(User);

    static async getById(req: Request, res: Response) {
        try {
            const id = parseInt(String(req.params.id));
            
            const user = await this.repo.findOne({
                where: { id },
                select: ["id", "username", "avatar_url"]
            });

            if (!user) return res.status(404).json({ message: "User not found" });
            res.json(user);
        } catch (error) {
            res.status(500).json({ message: "Internal error" });
        }
    }
}