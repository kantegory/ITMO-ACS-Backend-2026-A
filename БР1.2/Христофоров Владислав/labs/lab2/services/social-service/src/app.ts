import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';
import dataSource from './config/data-source';
import rabbitMQService from './utils/rabbitmq';

import { BlogPost } from './models/blog-post.entity';
import { Comment } from './models/comment.entity';
import { Like } from './models/like.entity';
import { Subscription } from './models/subscription.entity';

import { InternalSocialController } from './controllers/internal.controller';
import { BlogController } from './controllers/blog-post.controller';
import { SocialRecipeController } from './controllers/social-recipe.controller';
import { SocialUserController } from './controllers/social-user.controller';
import { AdminController } from './controllers/admin.controller';
import { CommentController } from './controllers/comment.controller';

const app = express();
const PORT = process.env.APP_PORT || 8003;

app.use(cors());

useExpressServer(app, {
    routePrefix: process.env.APP_API_PREFIX || '/api/v1',
    controllers: [
        BlogController,
        SocialRecipeController,
        SocialUserController,
        AdminController,
        CommentController,
    ],
    validation: true,
    classTransformer: true,
    defaultErrorHandler: true,
});

useExpressServer(app, {
    routePrefix: '',
    controllers: [InternalSocialController],
    validation: true,
    classTransformer: true,
    defaultErrorHandler: true,
});

const start = async () => {
    try {
        await dataSource.initialize();
        console.log('✅ Social Database connected!');

        // ПОДКЛЮЧАЕМСЯ К RABBITMQ И СЛУШАЕМ ОЧЕРЕДЬ
        await rabbitMQService.connect();
        await rabbitMQService.consume(
            'user_events',
            'social_service_user_deleted_queue',
            async (msg) => {
                console.log(
                    `[Social Service] Получено событие об удалении пользователя: ${msg.userId}`,
                );

                const blogRepo = dataSource.getRepository(BlogPost);
                const commentRepo = dataSource.getRepository(Comment);

                // Физически удаляем лайки и подписки
                await dataSource
                    .getRepository(Like)
                    .delete({ user_id: msg.userId });
                await dataSource
                    .getRepository(Subscription)
                    .delete({ follower_id: msg.userId });
                await dataSource
                    .getRepository(Subscription)
                    .delete({ following_id: msg.userId });

                // Мягко удаляем посты и комменты
                const blogs = await blogRepo.find({
                    where: { author_id: msg.userId },
                });
                if (blogs.length > 0) await blogRepo.softRemove(blogs);

                const comments = await commentRepo.find({
                    where: { user_id: msg.userId },
                });
                if (comments.length > 0) await commentRepo.softRemove(comments);

                console.log(
                    `[Social Service] Данные пользователя ${msg.userId} успешно очищены`,
                );
            },
        );

        app.listen(PORT, () => {
            console.log(`🚀 Social Service is running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Error:', err);
    }
};

start();
