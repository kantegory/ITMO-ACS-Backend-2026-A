import {
    Body,
    Delete,
    Get,
    Post,
    QueryParam,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Follow } from '../models/follow.entity';
import { User } from '../models/user.entity';

class FollowCreateDto {
    @IsNumber()
    @Type(() => Number)
    followerId: number;

    @IsNumber()
    @Type(() => Number)
    followingId: number;
}

@EntityController({
    baseRoute: '/follows',
    entity: Follow,
})
class FollowController extends BaseController {
    @Get('/')
    @OpenAPI({ summary: 'Get follows list' })
    async getAll(
        @QueryParam('followerId', { required: false, type: Number }) followerId?: number,
        @QueryParam('followingId', { required: false, type: Number }) followingId?: number,
    ) {
        const where: any = {};

        if (followerId) {
            where.follower = { id: followerId };
        }

        if (followingId) {
            where.following = { id: followingId };
        }

        return this.repository.find({
            where,
            relations: { follower: true, following: true },
        });
    }

    @Post('/')
    @OpenAPI({ summary: 'Create follow' })
    async create(@Body({ type: FollowCreateDto }) data: FollowCreateDto) {
        if (data.followerId === data.followingId) {
            return { message: 'User cannot follow himself' };
        }

        const follower = await User.findOneBy({ id: data.followerId });
        const following = await User.findOneBy({ id: data.followingId });

        if (!follower || !following) {
            return { message: 'Follower or following user not found' };
        }

        const existingFollow = await this.repository.findOne({
            where: {
                follower: { id: data.followerId },
                following: { id: data.followingId },
            },
        });

        if (existingFollow) {
            return { message: 'Follow already exists' };
        }

        const follow = this.repository.create({ follower, following });
        return this.repository.save(follow);
    }

    @Delete('/delete')
    @OpenAPI({ summary: 'Delete follow by id' })
    async deleteById(@QueryParam('id', { required: true, type: Number }) id: number) {
        const follow = await this.repository.findOneBy({ id });

        if (!follow) {
            return { message: 'Follow is not found' };
        }

        await this.repository.remove(follow);
        return { message: 'Follow deleted' };
    }

    @Delete('/by-users')
    @OpenAPI({ summary: 'Delete follow by users' })
    async deleteByUsers(
        @QueryParam('followerId', { required: true, type: Number }) followerId: number,
        @QueryParam('followingId', { required: true, type: Number }) followingId: number,
    ) {
        const follow = await this.repository.findOne({
            where: {
                follower: { id: followerId },
                following: { id: followingId },
            },
        });

        if (!follow) {
            return { message: 'Follow is not found' };
        }

        await this.repository.remove(follow);
        return { message: 'Follow deleted' };
    }
}

export default FollowController;
