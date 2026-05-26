import { Get, Post, Delete, Param, QueryParam, Req, Res, UseBefore, HttpCode } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { JsonController } from 'routing-controllers';
import { Response } from 'express';

import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { Favorite } from '../models/favorite.entity';
import { Property } from '../models/property.entity';
import { PropertyPhoto } from '../models/property-photo.entity';

@JsonController('/favorites')
class FavoriteController {
    @Get('')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Список избранных объектов', security: [{ bearerAuth: [] }] })
    async list(@Req() req: RequestWithUser, @QueryParam('page') page: number = 1, @QueryParam('page_size') pageSize: number = 20, @Res() res: Response) {
        const repo = dataSource.getRepository(Favorite);
        const [items, total] = await repo.findAndCount({
            where: { userId: req.user.id },
            relations: ['property'],
            skip: (page - 1) * pageSize,
            take: pageSize,
            order: { createdAt: 'DESC' },
        });

        const propertyIds = items.map((f) => f.propertyId);
        const photos: Record<number, string | null> = {};
        if (propertyIds.length) {
            const mainPhotos = await dataSource.getRepository(PropertyPhoto).find({
                where: propertyIds.map((id) => ({ propertyId: id, isMain: true })),
            });
            mainPhotos.forEach((ph) => { photos[ph.propertyId] = ph.url; });
        }

        return res.json({
            items: items.map((f) => ({
                id: f.property.id, title: f.property.title, type: f.property.type,
                city: f.property.city, price_per_month: f.property.pricePerMonth,
                currency: f.property.currency, rooms: f.property.rooms ?? null,
                area_sqm: f.property.areaSqm ?? null,
                main_photo_url: photos[f.propertyId] ?? null,
                status: f.property.status, is_favorited: true,
            })),
            total,
        });
    }

    @Post('/:propertyId')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Добавить в избранное', security: [{ bearerAuth: [] }] })
    async add(@Param('propertyId') propertyId: number, @Req() req: RequestWithUser, @Res() res: Response) {
        const property = await dataSource.getRepository(Property).findOneBy({ id: propertyId });
        if (!property) return res.status(404).json({ code: 'NOT_FOUND', message: 'Объект не найден' });

        const repo = dataSource.getRepository(Favorite);
        const existing = await repo.findOneBy({ userId: req.user.id, propertyId });
        if (existing) return res.status(409).json({ code: 'ALREADY_FAVORITED', message: 'Уже в избранном' });

        await repo.save(repo.create({ userId: req.user.id, propertyId }));
        return res.status(201).json({ message: 'Добавлено в избранное' });
    }

    @Delete('/:propertyId')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Удалить из избранного', security: [{ bearerAuth: [] }] })
    async remove(@Param('propertyId') propertyId: number, @Req() req: RequestWithUser, @Res() res: Response) {
        const repo = dataSource.getRepository(Favorite);
        const fav = await repo.findOneBy({ userId: req.user.id, propertyId });
        if (!fav) return res.status(404).json({ code: 'NOT_FOUND', message: 'Не в избранном' });
        await repo.delete(fav.id);
        return res.status(204).send();
    }
}

export default FavoriteController;
