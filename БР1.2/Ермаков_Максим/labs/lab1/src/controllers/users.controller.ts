import { Body, Get, JsonController, Patch, Req, UseBefore } from 'routing-controllers';
import { Type } from 'class-transformer';
import { OpenAPI } from 'routing-controllers-openapi';
import {
    IsOptional,
    IsString,
    Matches,
    MinLength,
} from 'class-validator';
import dataSource from '../config/data-source';
import { ApiError } from '../common/api-error';
import { serializeUserProfile } from '../common/serializers';
import { PHONE_REGEX } from '../common/validation';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import { User } from '../models/user.entity';
import checkPassword from '../utils/check-password';

class UpdateUserProfileDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    firstName?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    lastName?: string;

    @IsOptional()
    @IsString()
    @Matches(PHONE_REGEX)
    @Type(() => String)
    phone?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    currentPassword?: string;

    @IsOptional()
    @IsString()
    @MinLength(8)
    @Type(() => String)
    password?: string;
}

@JsonController('/users')
@OpenAPI({
    security: [{ bearerAuth: [] }],
})
class UsersController {
    private userRepository = dataSource.getRepository(User);

    @Get('/me')
    @UseBefore(authMiddleware)
    async getProfile(@Req() request: RequestWithUser) {
        return {
            data: serializeUserProfile(request.user as User),
        };
    }

    @Patch('/me')
    @UseBefore(authMiddleware)
    async updateProfile(
        @Req() request: RequestWithUser,
        @Body() body: UpdateUserProfileDto,
    ) {
        const user = request.user as User;

        if (body.phone && body.phone !== user.phone) {
            const phoneExists = await this.userRepository.existsBy({ phone: body.phone });
            if (phoneExists) {
                throw new ApiError(409, 'PHONE_EXISTS', 'User with this phone already exists');
            }
        }

        if (body.password) {
            if (!body.currentPassword) {
                throw new ApiError(
                    422,
                    'VALIDATION_ERROR',
                    'Current password is required to set a new password',
                );
            }

            if (!checkPassword(user.password, body.currentPassword)) {
                throw new ApiError(409, 'INVALID_PASSWORD', 'Current password is incorrect');
            }
        }

        if (body.firstName !== undefined) {
            user.firstName = body.firstName;
        }
        if (body.lastName !== undefined) {
            user.lastName = body.lastName;
        }
        if (body.phone !== undefined) {
            user.phone = body.phone;
        }
        if (body.password !== undefined) {
            user.password = body.password;
        }

        const updatedUser = await this.userRepository.save(user);

        return {
            data: serializeUserProfile(updatedUser),
        };
    }
}

export default UsersController;
