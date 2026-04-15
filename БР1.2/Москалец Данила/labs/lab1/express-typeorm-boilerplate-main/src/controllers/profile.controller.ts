import {
    BadRequestError,
    Body,
    JsonController,
    Put,
    Req,
    UnprocessableEntityError,
    UseBefore,
} from 'routing-controllers';
import { IsOptional, IsString, MinLength } from 'class-validator';

import dataSource from '../config/data-source';
import { AuthMiddleware, RequestWithUser } from '../middlewares/auth.middleware';
import { User } from '../models/user.entity';
import checkPassword from '../utils/check-password';
import { successResponse } from '../utils/response';
import { serializeUser } from '../utils/serializers';

class UpdateProfileDto {
    @IsOptional()
    @IsString()
    first_name?: string;

    @IsOptional()
    @IsString()
    last_name?: string;

    @IsOptional()
    @IsString()
    middle_name?: string;
}

class ChangePasswordDto {
    @IsString()
    old_password: string;

    @IsString()
    @MinLength(6)
    new_password: string;
}

@JsonController()
@UseBefore(AuthMiddleware)
class ProfileController {
    private userRepository = dataSource.getRepository(User);

    @Put('/profile')
    async updateProfile(
        @Req() req: RequestWithUser,
        @Body({ validate: true, type: UpdateProfileDto }) body: UpdateProfileDto,
    ) {
        const user = await this.userRepository.findOneByOrFail({ id: req.user.id });

        if (body.first_name !== undefined) {
            user.firstName = body.first_name;
        }

        if (body.last_name !== undefined) {
            user.lastName = body.last_name;
        }

        if (body.middle_name !== undefined) {
            user.middleName = body.middle_name;
        }

        const updatedUser = await this.userRepository.save(user);

        return successResponse(serializeUser(updatedUser));
    }

    @Put('/profile/password')
    async changePassword(
        @Req() req: RequestWithUser,
        @Body({ validate: true, type: ChangePasswordDto }) body: ChangePasswordDto,
    ) {
        if (body.new_password.length < 6) {
            throw new UnprocessableEntityError(
                'New password must be at least 6 characters',
            );
        }

        const user = await this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.id = :id', { id: req.user.id })
            .getOneOrFail();

        if (!checkPassword(user.password, body.old_password)) {
            throw new BadRequestError('Old password is incorrect');
        }

        user.password = body.new_password;
        await this.userRepository.save(user);

        return successResponse({}, 'Password updated');
    }
}

export default ProfileController;
