import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/db";
import { User } from "../entities/User";

export class AuthController {
    private static repo = AppDataSource.getRepository(User);

    static async register(req: Request, res: Response) {
        try {
            const { email, password, username } = req.body;
            const existing = await this.repo.findOneBy({ email });
            if (existing) return res.status(409).json({ message: "User already exists" });

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = this.repo.create({ username, email, password_hash: hashedPassword });
            await this.repo.save(user);

            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "secret", { expiresIn: '24h' });
            
            const { password_hash, ...userData } = user;
            res.status(201).json({ user: userData, token });
        } catch (e) {
            res.status(400).json({ message: "Register error" });
        }
    }

    static async login(req: Request, res: Response) {
        const { email, password } = req.body;
        const user = await this.repo.findOneBy({ email });
        
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "secret", { expiresIn: '24h' });
        
        const { password_hash, ...userData } = user;
        res.json({ user: userData, token });
    }

    // НОВЫЙ МЕТОД: Обновление токена
    static async refresh(req: Request, res: Response) {
        try {
            const { token } = req.body;
            if (!token) return res.status(401).json({ message: "Token is required" });

            // Проверяем старый токен
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as { userId: number };
            
            // Если валиден — создаем новый
            const newToken = jwt.sign(
                { userId: decoded.userId }, 
                process.env.JWT_SECRET || "secret", 
                { expiresIn: '24h' }
            );

            res.json({ token: newToken });
        } catch (error) {
            res.status(401).json({ message: "Invalid or expired token" });
        }
    }
}