import { Get, Post, Body, Param, QueryParam, Res, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { JsonController } from 'routing-controllers';
import { Response } from 'express';

import serviceAuthMiddleware from '../middlewares/service-auth.middleware';
import dataSource from '../config/data-source';
import { User } from '../models/user.entity';
import { UserRoleEntity, UserRole } from '../models/user-role.entity';

class CreateUserDto {
    @IsInt() @Type(() => Number) id: number;
    @IsString() @Type(() => String) first_name: string;
    @IsString() @Type(() => String) last_name: string;
    @IsString() @IsOptional() @Type(() => String) phone?: string;
    @IsEnum(UserRole) @IsOptional() role?: UserRole;
}

function buildUserProfile(user: User, roles: UserRoleEntity[]) {
    return {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        phone: user.phone ?? null,
        avatar_url: user.avatarUrl ?? null,
        roles: roles.map((r) => r.role),
    };
}

@JsonController('/internal/users')
class InternalUserController {
    @Post('')
    @UseBefore(serviceAuthMiddleware)
    @OpenAPI({ summary: 'Создать профиль пользователя (internal)' })
    async createUser(@Body({ type: CreateUserDto }) dto: CreateUserDto, @Res() res: Response) {
        const repo = dataSource.getRepository(User);
        const existing = await repo.findOneBy({ id: dto.id });
        if (existing) return res.status(409).json({ code: 'USER_ALREADY_EXISTS', message: 'User already exists' });

        const user = repo.create({ id: dto.id, firstName: dto.first_name, lastName: dto.last_name, phone: dto.phone ?? null });
        await repo.save(user);

        if (dto.role) {
            const roleRepo = dataSource.getRepository(UserRoleEntity);
            await roleRepo.save(roleRepo.create({ userId: user.id, role: dto.role }));
        }

        const roles = await dataSource.getRepository(UserRoleEntity).findBy({ userId: user.id });
        return res.status(201).json(buildUserProfile(user, roles));
    }

    @Get('')
    @UseBefore(serviceAuthMiddleware)
    @OpenAPI({ summary: 'Пакетное получение профилей (internal)' })
    async getUsers(@QueryParam('ids') ids: string, @Res() res: Response) {
        if (!ids) return res.status(400).json({ code: 'BAD_REQUEST', message: "Query param 'ids' is required" });

        const idList = ids.split(',').map((s) => parseInt(s.trim())).filter((n) => !isNaN(n));
        if (!idList.length) return res.status(400).json({ code: 'BAD_REQUEST', message: 'No valid IDs provided' });

        const users = await dataSource.getRepository(User).findByIds(idList);
        const allRoles = await dataSource.getRepository(UserRoleEntity).find({
            where: idList.map((id) => ({ userId: id })),
        });

        const roleMap: Record<number, UserRoleEntity[]> = {};
        allRoles.forEach((r) => { (roleMap[r.userId] ||= []).push(r); });

        return res.json({ users: users.map((u) => buildUserProfile(u, roleMap[u.id] || [])) });
    }

    @Get('/:id')
    @UseBefore(serviceAuthMiddleware)
    @OpenAPI({ summary: 'Получить профиль пользователя по ID (internal)' })
    async getUser(@Param('id') id: number, @Res() res: Response) {
        const user = await dataSource.getRepository(User).findOneBy({ id });
        if (!user) return res.status(404).json({ code: 'NOT_FOUND', message: `User with id ${id} not found` });
        const roles = await dataSource.getRepository(UserRoleEntity).findBy({ userId: id });
        return res.json(buildUserProfile(user, roles));
    }
}

export default InternalUserController;
