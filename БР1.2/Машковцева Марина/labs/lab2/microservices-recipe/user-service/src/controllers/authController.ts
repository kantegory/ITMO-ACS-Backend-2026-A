import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { User } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const register = async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;
        const userRepo = AppDataSource.getRepository(User);
        const existing = await userRepo.findOne({ where: [{ email }, { username }] });
        if (existing) return res.status(400).json({ message: "User already exists" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = userRepo.create({ username, email, password: hashedPassword });
        await userRepo.save(user);
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({ token, user: { id: user.id, username, email } });
    } catch (error) {
        res.status(500).json({ message: "Registration failed" });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await AppDataSource.getRepository(User).findOne({ where: { email } });
        if (!user) return res.status(401).json({ message: "Invalid credentials" });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ message: "Invalid credentials" });
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
        res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: "Login failed" });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const user = await AppDataSource.getRepository(User).findOne({
            where: { id: userId },
            select: ["id", "username", "email", "avatar_url", "bio", "created_at"]
        });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Failed to get profile" });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { username, avatar_url, bio } = req.body;
        await AppDataSource.getRepository(User).update(userId, { username, avatar_url, bio });
        res.json({ message: "Profile updated" });
    } catch (error) {
        res.status(500).json({ message: "Failed to update profile" });
    }
};
