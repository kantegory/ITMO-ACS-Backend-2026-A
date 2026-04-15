import {
    Delete,
    Get,
    JsonController,
    NotFoundError,
    Param,
    Post,
    QueryParams,
    Req,
    UseBefore,
} from 'routing-controllers';

import ConflictError from '../common/conflict-error';
import dataSource from '../config/data-source';
import { AuthMiddleware, RequestWithUser } from '../middlewares/auth.middleware';
import { Favorite } from '../models/favorite.entity';
import { Service } from '../models/service.entity';
import { User } from '../models/user.entity';
import { getPagination } from '../utils/pagination';
import { paginatedResponse, successResponse } from '../utils/response';
import { serializeFavorite } from '../utils/serializers';

@JsonController('/favorites')
@UseBefore(AuthMiddleware)
class FavoritesController {
    private favoriteRepository = dataSource.getRepository(Favorite);

    private serviceRepository = dataSource.getRepository(Service);

    private userRepository = dataSource.getRepository(User);

    @Get()
    async list(@Req() req: RequestWithUser, @QueryParams() query: any) {
        const { limit, offset } = getPagination(query);
        const [favorites, total] = await this.favoriteRepository.findAndCount({
            where: {
                user: { id: req.user.id },
            },
            relations: {
                service: {
                    company: true,
                    discount: true,
                },
            },
            skip: offset,
            take: limit,
            order: {
                createdAt: 'DESC',
            },
        });

        return paginatedResponse(
            favorites.map(serializeFavorite),
            total,
            offset,
            limit,
        );
    }

    @Post('/:serviceId')
    async add(@Param('serviceId') serviceId: number, @Req() req: RequestWithUser) {
        const existing = await this.favoriteRepository.findOne({
            where: {
                user: { id: req.user.id },
                service: { id: Number(serviceId) },
            },
        });

        if (existing) {
            throw new ConflictError('Already in favorites');
        }

        const service = await this.serviceRepository.findOne({
            where: { id: Number(serviceId) },
        });

        if (!service) {
            throw new NotFoundError('Service not found');
        }

        const user = await this.userRepository.findOneByOrFail({ id: req.user.id });
        const favorite = this.favoriteRepository.create({
            user,
            service,
        });

        await this.favoriteRepository.save(favorite);

        return successResponse({}, 'Added to favorites');
    }

    @Delete('/:serviceId')
    async remove(
        @Param('serviceId') serviceId: number,
        @Req() req: RequestWithUser,
    ) {
        const favorite = await this.favoriteRepository.findOne({
            where: {
                user: { id: req.user.id },
                service: { id: Number(serviceId) },
            },
        });

        if (!favorite) {
            throw new NotFoundError('Favorite not found');
        }

        await this.favoriteRepository.remove(favorite);

        return successResponse({}, 'Removed from favorites');
    }
}

export default FavoritesController;
