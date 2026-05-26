import { Get, Patch, Post, Body, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { JsonController } from 'routing-controllers';
import { Response } from 'express';

import SETTINGS from '../config/settings';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { User } from '../models/user.entity';
import { UserRoleEntity, UserRole } from '../models/user-role.entity';

class UpdateProfileDto {
    @IsString() @IsOptional() @Type(() => String) first_name?: string;
    @IsString() @IsOptional() @Type(() => String) last_name?: string;
    @IsString() @IsOptional() @Type(() => String) phone?: string;
    @IsString() @IsOptional() @Type(() => String) avatar_url?: string;
}

class AddRoleDto {
    @IsEnum(UserRole) role: UserRole;
}

function buildProfile(user: User, roles: UserRoleEntity[]) {
    return {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        phone: user.phone ?? null,
        avatar_url: user.avatarUrl ?? null,
        roles: roles.map((r) => r.role),
        created_at: user.createdAt,
    };
}

@JsonController('/profile')
class ProfileController {
    @Get('')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Получить профиль текущего пользователя', security: [{ bearerAuth: [] }] })
    async getProfile(@Req() req: RequestWithUser, @Res() res: Response) {
        const user = await dataSource.getRepository(User).findOneBy({ id: req.user.id });
        if (!user) return res.status(404).json({ code: 'NOT_FOUND', message: 'Пользователь не найден' });
        const roles = await dataSource.getRepository(UserRoleEntity).findBy({ userId: user.id });
        return res.json(buildProfile(user, roles));
    }

    @Patch('')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Обновить профиль', security: [{ bearerAuth: [] }] })
    async updateProfile(@Req() req: RequestWithUser, @Body({ type: UpdateProfileDto }) dto: UpdateProfileDto, @Res() res: Response) {
        const repo = dataSource.getRepository(User);
        const user = await repo.findOneBy({ id: req.user.id });
        if (!user) return res.status(404).json({ code: 'NOT_FOUND', message: 'Пользователь не найден' });

        if (dto.first_name !== undefined) user.firstName = dto.first_name;
        if (dto.last_name !== undefined) user.lastName = dto.last_name;
        if (dto.phone !== undefined) user.phone = dto.phone;
        if (dto.avatar_url !== undefined) user.avatarUrl = dto.avatar_url;
        await repo.save(user);

        const roles = await dataSource.getRepository(UserRoleEntity).findBy({ userId: user.id });
        return res.json(buildProfile(user, roles));
    }

    @Post('/roles')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Добавить роль пользователю', security: [{ bearerAuth: [] }] })
    async addRole(@Req() req: RequestWithUser, @Body({ type: AddRoleDto }) dto: AddRoleDto, @Res() res: Response) {
        const roleRepo = dataSource.getRepository(UserRoleEntity);
        const existing = await roleRepo.findOneBy({ userId: req.user.id, role: dto.role });
        if (existing) return res.status(409).json({ code: 'ROLE_ALREADY_ASSIGNED', message: 'Роль уже назначена' });

        await roleRepo.save(roleRepo.create({ userId: req.user.id, role: dto.role }));

        const user = await dataSource.getRepository(User).findOneBy({ id: req.user.id });
        const roles = await roleRepo.findBy({ userId: req.user.id });
        return res.status(201).json(buildProfile(user, roles));
    }
}

export default ProfileController;
