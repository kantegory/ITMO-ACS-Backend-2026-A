import 'reflect-metadata';

import cors from 'cors';
import express from 'express';

import { asyncHandler } from '../shared/async-handler';
import { requireServiceToken, requireUser, RequestWithUser } from '../shared/auth';
import {
    badRequest,
    conflict,
    errorHandler,
    notFound,
    notFoundHandler,
} from '../shared/errors';
import { serviceRequest } from '../shared/http-client';
import { paginated, parseId, parsePagination } from '../shared/pagination';
import SETTINGS from '../shared/settings';
import { mountInternalSwagger } from '../shared/swagger';
import interactionDataSource from './data-source';
import { Comment } from './entities/comment.entity';
import { Favorite } from './entities/favorite.entity';
import { RecipeLike } from './entities/recipe-like.entity';

type PublicUser = {
    id: number;
    username: string;
    email: string;
    avatarUrl: string | null;
};

type RecipeExistsResponse = {
    id: number;
    exists: boolean;
    authorId: number;
    status: string;
};

const app = express();

app.use(cors());
app.use(express.json());

mountInternalSwagger(app);

const commentRepository = () => interactionDataSource.getRepository(Comment);
const likeRepository = () => interactionDataSource.getRepository(RecipeLike);
const favoriteRepository = () => interactionDataSource.getRepository(Favorite);

const assertRecipeExists = async (recipeId: number): Promise<RecipeExistsResponse> =>
    serviceRequest<RecipeExistsResponse>(
        SETTINGS.RECIPE_SERVICE_URL,
        `/internal/recipes/${recipeId}/exists`,
        'interaction-service',
    );

const getPublicUser = async (userId: number): Promise<PublicUser> =>
    serviceRequest<PublicUser>(
        SETTINGS.AUTH_SERVICE_URL,
        `/internal/users/${userId}/public`,
        'interaction-service',
    );

const validateCommentContent = (value: unknown): string => {
    if (typeof value !== 'string' || value.length < 1 || value.length > 2000) {
        throw badRequest('content must be a string from 1 to 2000 characters');
    }

    return value;
};

const getAuthorsMap = async (authorIds: number[]): Promise<Map<number, PublicUser>> => {
    const uniqueIds = Array.from(new Set(authorIds));
    const users = await Promise.all(uniqueIds.map((id) => getPublicUser(id)));

    return new Map(users.map((user) => [user.id, user]));
};

const toCommentResponse = (comment: Comment, author: PublicUser) => ({
    id: comment.id,
    recipeId: comment.recipeId,
    author: {
        id: author.id,
        username: author.username,
        avatarUrl: author.avatarUrl,
    },
    content: comment.content,
    createdAt: comment.createdAt,
});

app.get('/health', (_request, response) => {
    response.json({ service: 'interaction-service', status: 'ok' });
});

app.get(
    '/internal/recipes/:recipeId/stats',
    requireServiceToken,
    asyncHandler(async (request, response) => {
        const recipeId = parseId(request.params.recipeId, 'recipeId');

        await assertRecipeExists(recipeId);

        const [commentsCount, likesCount, favoritesCount] = await Promise.all([
            commentRepository().countBy({ recipeId }),
            likeRepository().countBy({ recipeId }),
            favoriteRepository().countBy({ recipeId }),
        ]);

        response.json({
            recipeId,
            commentsCount,
            likesCount,
            favoritesCount,
        });
    }),
);

app.get(
    '/internal/recipes/:recipeId/user-state',
    requireServiceToken,
    asyncHandler(async (request, response) => {
        const recipeId = parseId(request.params.recipeId, 'recipeId');
        const userId = parseId(request.query.userId, 'userId');

        const [like, favorite] = await Promise.all([
            likeRepository().findOneBy({ recipeId, userId }),
            favoriteRepository().findOneBy({ recipeId, userId }),
        ]);

        response.json({
            recipeId,
            userId,
            isLiked: Boolean(like),
            isFavorite: Boolean(favorite),
        });
    }),
);

app.delete(
    '/internal/recipes/:recipeId/interactions',
    requireServiceToken,
    asyncHandler(async (request, response) => {
        const recipeId = parseId(request.params.recipeId, 'recipeId');

        await Promise.all([
            commentRepository().delete({ recipeId }),
            likeRepository().delete({ recipeId }),
            favoriteRepository().delete({ recipeId }),
        ]);

        response.status(204).send();
    }),
);

app.get(
    `${SETTINGS.APP_API_PREFIX}/recipes/:recipeId/comments`,
    requireUser,
    asyncHandler(async (request, response) => {
        const recipeId = parseId(request.params.recipeId, 'recipeId');
        const { page, size } = parsePagination(request.query);

        await assertRecipeExists(recipeId);

        const [comments, totalItems] = await commentRepository()
            .createQueryBuilder('comment')
            .where('comment.recipe_id = :recipeId', { recipeId })
            .orderBy('comment.created_at', 'DESC')
            .skip((page - 1) * size)
            .take(size)
            .getManyAndCount();

        const authorsMap = await getAuthorsMap(comments.map((comment) => comment.authorId));

        response.json(
            paginated(
                comments.map((comment) => {
                    const author = authorsMap.get(comment.authorId);

                    if (!author) {
                        throw notFound('Comment author was not found', 'USER_NOT_FOUND');
                    }

                    return toCommentResponse(comment, author);
                }),
                page,
                size,
                totalItems,
            ),
        );
    }),
);

app.post(
    `${SETTINGS.APP_API_PREFIX}/recipes/:recipeId/comments`,
    requireUser,
    asyncHandler<RequestWithUser>(async (request, response) => {
        const recipeId = parseId(request.params.recipeId, 'recipeId');
        const userId = request.user!.id;
        const content = validateCommentContent((request.body as { content?: unknown }).content);

        await assertRecipeExists(recipeId);
        const author = await getPublicUser(userId);

        const comment = await commentRepository().save(
            commentRepository().create({
                recipeId,
                authorId: userId,
                content,
            }),
        );

        response.status(201).json(toCommentResponse(comment, author));
    }),
);

app.post(
    `${SETTINGS.APP_API_PREFIX}/recipes/:recipeId/like`,
    requireUser,
    asyncHandler<RequestWithUser>(async (request, response) => {
        const recipeId = parseId(request.params.recipeId, 'recipeId');
        const userId = request.user!.id;

        await assertRecipeExists(recipeId);

        const existingLike = await likeRepository().findOneBy({ recipeId, userId });

        if (existingLike) {
            throw conflict('Like already exists');
        }

        const like = await likeRepository().save(
            likeRepository().create({
                recipeId,
                userId,
            }),
        );

        response.status(201).json({
            recipeId,
            userId,
            createdAt: like.createdAt,
        });
    }),
);

app.delete(
    `${SETTINGS.APP_API_PREFIX}/recipes/:recipeId/like`,
    requireUser,
    asyncHandler<RequestWithUser>(async (request, response) => {
        const recipeId = parseId(request.params.recipeId, 'recipeId');
        const userId = request.user!.id;

        await assertRecipeExists(recipeId);

        const result = await likeRepository().delete({ recipeId, userId });

        if (!result.affected) {
            throw notFound('Like not found');
        }

        response.status(204).send();
    }),
);

app.post(
    `${SETTINGS.APP_API_PREFIX}/recipes/:recipeId/favorite`,
    requireUser,
    asyncHandler<RequestWithUser>(async (request, response) => {
        const recipeId = parseId(request.params.recipeId, 'recipeId');
        const userId = request.user!.id;

        await assertRecipeExists(recipeId);

        const existingFavorite = await favoriteRepository().findOneBy({ recipeId, userId });

        if (existingFavorite) {
            throw conflict('Recipe already in favorites');
        }

        const favorite = await favoriteRepository().save(
            favoriteRepository().create({
                recipeId,
                userId,
            }),
        );

        response.status(201).json({
            recipeId,
            userId,
            createdAt: favorite.createdAt,
        });
    }),
);

app.delete(
    `${SETTINGS.APP_API_PREFIX}/recipes/:recipeId/favorite`,
    requireUser,
    asyncHandler<RequestWithUser>(async (request, response) => {
        const recipeId = parseId(request.params.recipeId, 'recipeId');
        const userId = request.user!.id;

        await assertRecipeExists(recipeId);

        const result = await favoriteRepository().delete({ recipeId, userId });

        if (!result.affected) {
            throw notFound('Favorite not found');
        }

        response.status(204).send();
    }),
);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async (): Promise<void> => {
    await interactionDataSource.initialize();

    app.listen(SETTINGS.INTERACTION_SERVICE_PORT, SETTINGS.APP_HOST, () => {
        console.log(
            `interaction-service listening on ${SETTINGS.APP_PROTOCOL}://${SETTINGS.APP_HOST}:${SETTINGS.INTERACTION_SERVICE_PORT}`,
        );
    });
};

void start().catch((error) => {
    console.error('interaction-service initialization failed:', error);
    process.exit(1);
});

export default app;
