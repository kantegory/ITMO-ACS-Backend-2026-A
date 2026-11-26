import { Request, Response } from "express";
import axios from "axios";
import { AppDataSource } from "../data-source";
import { Subscription } from "../models/Subscription";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3001";

async function checkUserExists(userId: number): Promise<boolean> {
    try {
        await axios.get(`${USER_SERVICE_URL}/internal/users/${userId}`);
        return true;
    } catch {
        return false;
    }
}

// GET /subscriptions/me - получить подписки текущего пользователя
export const getSubscriptions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const subscriptions = await AppDataSource.getRepository(Subscription).find({
            where: { subscriber_id: userId }
        });
        res.json(subscriptions);
    } catch (error) {
        res.status(500).json({ message: "Failed to get subscriptions" });
    }
};

// POST /subscriptions/user/:userId - подписаться на пользователя
export const subscribe = async (req: Request, res: Response) => {
    try {
        const subscriberId = (req as any).userId;
        const authorId = parseInt(req.params.userId as string);

        if (subscriberId === authorId) {
            return res.status(400).json({ message: "Cannot subscribe to yourself" });
        }

        const authorExists = await checkUserExists(authorId);
        if (!authorExists) {
            return res.status(404).json({ message: "User not found" });
        }

        const existing = await AppDataSource.getRepository(Subscription).findOne({
            where: { subscriber_id: subscriberId, author_id: authorId }
        });

        if (existing) {
            return res.status(400).json({ message: "Already subscribed" });
        }

        const subscription = AppDataSource.getRepository(Subscription).create({
            subscriber_id: subscriberId,
            author_id: authorId
        });
        await AppDataSource.getRepository(Subscription).save(subscription);
        res.status(201).json({ message: "Subscribed" });
    } catch (error) {
        res.status(500).json({ message: "Failed to subscribe" });
    }
};

// DELETE /subscriptions/user/:userId - отписаться
export const unsubscribe = async (req: Request, res: Response) => {
    try {
        const subscriberId = (req as any).userId;
        const authorId = parseInt(req.params.userId as string);

        await AppDataSource.getRepository(Subscription).delete({
            subscriber_id: subscriberId,
            author_id: authorId
        });
        res.json({ message: "Unsubscribed" });
    } catch (error) {
        res.status(500).json({ message: "Failed to unsubscribe" });
    }
};
