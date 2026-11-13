import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../models/User";

export const getUserById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string); 
        const user = await AppDataSource.getRepository(User).findOne({
            where: { id },
            select: ["id", "username", "email", "avatar_url"]
        });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Failed to get user" });
    }
};