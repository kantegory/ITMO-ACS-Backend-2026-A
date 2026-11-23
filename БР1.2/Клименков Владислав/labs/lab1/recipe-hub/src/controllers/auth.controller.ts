import type { Request, Response } from 'express'

import { LoginResponseSchema } from '../schemas/auth.schemas.js'
import type { ChangePasswordRequestType, LoginRequestType, RegisterRequestType } from '../schemas/auth.schemas.js'
import { AuthService } from '../services/auth.service.js'
import { UserReadSchema } from '../schemas/user.schemas.js'
import type { AuthRequest } from '../middlewares/auth.middleware.js'


export class AuthController {
    static async register(req: Request, res: Response) {
        try {
            const registerRequestData: RegisterRequestType = req.body
            const user = await AuthService.register(registerRequestData)
            res.status(201).json(UserReadSchema.parse(user))
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async login(req: Request, res: Response) {
        try {
            const loginRequestData: LoginRequestType = req.body
            const result = await AuthService.login(loginRequestData);
            res.status(200).json(LoginResponseSchema.parse(result))
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async changePassword(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const changePasswordRequestData: ChangePasswordRequestType = req.body;
            await AuthService.changePassword(currentUserId, changePasswordRequestData);
            res.status(200)
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };
};
