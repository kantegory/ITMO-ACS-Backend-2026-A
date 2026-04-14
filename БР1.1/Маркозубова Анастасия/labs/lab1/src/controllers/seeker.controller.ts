import {
    Body,
    Get,
    Post,
    Patch,
    UseBefore,
    Req,
    HttpError
} from 'routing-controllers';

import { IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import AuthOpenAPI from '../common/auth-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { Seeker } from '../models/seeker.entity';
import { User } from '../models/user.entity';

import authMiddleware from '../middlewares/auth.middleware';

class CreateSeekerCheck {
    @IsString()
    @Type(() => String)
    first_name: string;

    @IsString()
    @Type(() => String)
    last_name: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    bio: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    contact_info: string;
}

class UpdateSeekerCheck {
    @IsOptional()
    @IsString()
    @Type(() => String)
    first_name: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    last_name: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    bio: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    contact_info: string;
}

@EntityController({
    baseRoute: '/seekers',
    entity: Seeker,
})
class SeekerController extends BaseController {
    @Post('')
    @AuthOpenAPI('Создать профиль соискателя', ['seekers'])
    @UseBefore(authMiddleware)
    async create(
        @Req() request: any,
        @Body({ type: CreateSeekerCheck }) body: CreateSeekerCheck,
    ) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'seeker') {
            throw new HttpError(403, 'Only seeker can create seeker profile');
        }

        const existingSeeker = await this.repository.findOne({
            where: {
                user: {
                    user_id: currentUserId,
                },
            },
            relations: ['user'],
        });

        if (existingSeeker) {
            throw new HttpError(409, 'Seeker profile already exists');
        }

        const userRepository = User.getRepository();
        const user = await userRepository.findOneBy({
            user_id: currentUserId,
        });

        if (!user) {
            throw new HttpError(404, 'User not found');
        }

        const seeker = this.repository.create({
            first_name: body.first_name,
            last_name: body.last_name,
            phone: body.phone,
            bio: body.bio,
            contact_info: body.contact_info,
            user,
        });

        const savedSeeker = await this.repository.save(seeker);
        return savedSeeker;
    }

    @Get('/me')
    @AuthOpenAPI('Получить свой профиль соискателя', ['seekers'])
    @UseBefore(authMiddleware)
    async me(@Req() request: any) {
        const currentuserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'seeker') {
            throw new HttpError(403, 'Only seeker can view seeker profile');
        }

        const seeker = await this.repository.findOne({
            where: {
                user: {
                    user_id: currentuserId,
                },
            },
            relations: ['user'],
        });

        if (!seeker) {
            throw new HttpError(404, 'Seeker profile not found');
        }
        return seeker;
    }

    @Patch('/me')
    @AuthOpenAPI('Обновить свой профиль соискателя', ['seekers'])
    @UseBefore(authMiddleware)
    async update(
        @Req() request: any,
        @Body({ type: UpdateSeekerCheck }) body: UpdateSeekerCheck,
    ) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'seeker') {
            throw new HttpError(403, 'Only seeker can update seeker profile');
        }

        const seeker = await this.repository.findOne({
            where: {
                user: {
                    user_id: currentUserId,
                },
            },
            relations: ['user'],
        });

        if (!seeker) {
            throw new HttpError(404, 'Seeker profile not found');
        }

        if (body.first_name !== undefined) {
            seeker.first_name = body.first_name;
        }

        if (body.last_name !== undefined) {
            seeker.last_name = body.last_name;
        }

        if (body.phone !== undefined) {
            seeker.phone = body.phone;
        }

        if (body.bio !== undefined) {
            seeker.bio = body.bio;
        }

        if (body.contact_info !== undefined) {
            seeker.contact_info = body.contact_info;
        }

        const updatedSeeker = await this.repository.save(seeker);
        return updatedSeeker;
    }
}

export default SeekerController;
