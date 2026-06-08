import {
    JsonController,
    Post,
    Delete,
    Get,
    Param,
    QueryParam,
    HttpError,
    Req,
    UseBefore,
    HttpCode,
} from "routing-controllers";
import axios from "axios";
import dataSource from "../config/data-source";
import { extractUserMiddleware } from "../middlewares/extract-user.middleware";
import { Subscription } from "../models/subscription.entity";
import { Request } from "express";

@JsonController("/users")
export class SocialUserController {
    private subRepo = dataSource.getRepository(Subscription);
    private identityUrl =
        process.env.IDENTITY_SERVICE_URL || "http://localhost:8001";

    @Post("/:id/subscribe")
    @HttpCode(201)
    @UseBefore(extractUserMiddleware)
    async subscribe(@Param("id") id: string, @Req() req: Request) {
        const followerId = (req as any).user.id;
        if (followerId === id)
            throw new HttpError(400, "Нельзя подписаться на себя");

        try {
            await axios.get(`${this.identityUrl}/internal/users/${id}/exists`);
        } catch (error) {
            throw new HttpError(404, "Пользователь для подписки не найден");
        }

        const existing = await this.subRepo.findOneBy({
            follower_id: followerId,
            following_id: id,
        });
        if (!existing) {
            await this.subRepo.save(
                this.subRepo.create({
                    follower_id: followerId,
                    following_id: id,
                }),
            );
        }
        return { message: "Подписка оформлена" };
    }

    @Delete("/:id/subscribe")
    @HttpCode(204)
    @UseBefore(extractUserMiddleware)
    async unsubscribe(@Param("id") id: string, @Req() req: Request) {
        await this.subRepo.delete({
            follower_id: (req as any).user.id,
            following_id: id,
        });
        return null;
    }

    @Get("/:id/subscribers")
    async getSubscribers(
        @Param("id") id: string,
        @QueryParam("limit") limit: number = 20,
        @QueryParam("offset") offset: number = 0,
    ) {
        const subscriptions = await this.subRepo.find({
            where: { following_id: id },
            take: limit,
            skip: offset,
        });
        const followerIds = subscriptions.map((sub) => sub.follower_id);

        if (followerIds.length === 0) return [];

        try {
            const { data } = await axios.post(
                `${this.identityUrl}/internal/users/bulk`,
                { userIds: followerIds },
            );
            return data;
        } catch (e) {
            return followerIds.map((fid) => ({
                id: fid,
                username: "Unknown User",
            }));
        }
    }

    @Get("/:id/subscriptions")
    async getSubscriptions(
        @Param("id") id: string,
        @QueryParam("limit") limit: number = 20,
        @QueryParam("offset") offset: number = 0,
    ) {
        const subscriptions = await this.subRepo.find({
            where: { follower_id: id },
            take: limit,
            skip: offset,
        });
        const followingIds = subscriptions.map((sub) => sub.following_id);

        if (followingIds.length === 0) return [];

        try {
            const { data } = await axios.post(
                `${this.identityUrl}/internal/users/bulk`,
                { userIds: followingIds },
            );
            return data;
        } catch (e) {
            return followingIds.map((fid) => ({
                id: fid,
                username: "Unknown User",
            }));
        }
    }
}
