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

export default UserController;
