import {
    Body,
    Get,
    Patch,
    UseBefore,
    Req,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';

class UpdateMeDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    name?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    another_contact?: string;
}

@EntityController({
    baseRoute: '/users',
    entity: User,
})
class UserController extends BaseController {
    @UseBefore(authMiddleware)
    @Patch('/me')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async updateMe(
        @Req() request: RequestWithUser,
        @Body({ type: UpdateMeDto }) body: UpdateMeDto,
    ): Promise<{ success: boolean }> {
        const { user } = request;
        const userForUpdate = await this.repository.findOneBy({ id: user.id });

        Object.assign(userForUpdate, body);
        await this.repository.save(userForUpdate);

        return { success: true };
    }

    @UseBefore(authMiddleware)
    @Get('/me')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async me(@Req() request: RequestWithUser) {
        const { user } = request;
        const results = await this.repository.findOneBy({ id: user.id });

        return results;
    }
}


import { JsonController, Post} from 'routing-controllers';
import jwt from 'jsonwebtoken';
import SETTINGS from '../config/settings';

class VerifyTokenBody {
    @IsString()
    token!: string;
}

@JsonController('/internal')
export class InternalAuthController {

    @Post('/verify')
    @OpenAPI({ deprecated: true })
    async verifyToken(@Body() body: VerifyTokenBody) {
        const { token } = body;

        try {
            const { user } = jwt.verify(token, SETTINGS.JWT_SECRET_KEY) as { user: any };

            return {
                valid: true,
                user: user
            };
        } catch (error) {
            console.error(error);
            return {
                valid: false,
                error: 'Token is invalid or expired'
            };
        }
    }
}

export default UserController;
