import type { Response } from 'express'
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { AuthService } from '../services/auth.service.js';
import { UserService } from '../services/user.service.js';
import { 
    UserReadListSchema, 
    UserReadSchema, 
    type UserRoleUpdateType, 
    type UserUpdateType
} from '../schemas/user.schemas.js';


export class UserController {
    static async getUsers(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            if (!(await AuthService.isUserAdmin(currentUserId))) {
                res.status(403).json({
                    message: "Доступ только для администраторов"
                })
                return;
            };
            const { page:pageStr='1', limit:limitStr='20' } = req.query;
            const page = parseInt(pageStr as string)
            const limit = parseInt(limitStr as string)
            const users = await UserService.getUsers(page, limit);
            res.status(200).json(UserReadListSchema.parse(users))
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async getCurrentUser(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const currentUser = await UserService.getUser(currentUserId)
            res.status(200).json(UserReadSchema.parse(currentUser))
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async updateCurrentUser(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const userUpdateData: UserUpdateType = req.body;
            const updatedCurrentUser = await UserService.updateUser(currentUserId, userUpdateData);
            res.status(200).json(UserReadSchema.parse(updatedCurrentUser));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async deleteCurrentUsers(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            await UserService.deleteUser(currentUserId);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async getUser(req: AuthRequest, res: Response) {
        try {
            const { userId:userIdStr } = req.params;
            const userId = parseInt(userIdStr as string);
            const user = await UserService.getUser(userId);
            res.status(200).json(UserReadSchema.parse(user));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async deleteUser(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            if (!(await AuthService.isUserAdmin(currentUserId))) {
                res.status(403).json({
                    message: "Доступ только для администраторов"
                })
                return;
            };
            const { userId:userIdStr } = req.params;
            const userId = parseInt(userIdStr as string);
            await UserService.deleteUser(userId);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async updateUserRole(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            if (!(await AuthService.isUserAdmin(currentUserId))) {
                res.status(403).json({
                    message: "Доступ только для администраторов"
                })
                return;
            };
            const { userId:userIdStr } = req.params;
            const userId = parseInt(userIdStr as string);
            const userRoleUpdateData: UserRoleUpdateType = req.body;
            const user = await UserService.updateUserRole(userId, userRoleUpdateData);
            res.status(200).json(UserReadSchema.parse(user))
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };
}
