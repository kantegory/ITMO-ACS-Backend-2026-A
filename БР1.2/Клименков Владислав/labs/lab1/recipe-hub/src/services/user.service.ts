import type { Role } from '@prisma/client';
import { prisma } from '../config/database.js';
import type { UserRoleUpdateType, UserUpdateType } from '../schemas/user.schemas.js';


export class UserService {
    static async getUsers(page: number, limit: number) {
        const skip = (page - 1) * limit;
        const users = await prisma.user.findMany({
            skip: skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        });
        return users;
    };

    static async getUser(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new Error('Пользователь не найден');
        };
        return user;
    };

    static async updateUser(userId: number, userUpdateData: UserUpdateType) {
        const filteredData = Object.fromEntries(
            Object.entries(userUpdateData).filter(([_, v]) => v !== undefined)
        );
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: filteredData,
        });
        return updatedUser;
    };

    static async deleteUser(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('Пользователь не найден');
        }
        await prisma.user.delete({ 
            where: { id: userId } 
        });
    };

    static async updateUserRole(userId: number, userRoleUpdateData: UserRoleUpdateType) {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                role: userRoleUpdateData.role as Role,
            },
        });
        return updatedUser;
    };
};
