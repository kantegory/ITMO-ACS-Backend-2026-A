import {
    Body,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    NotFoundError,
    HttpCode,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsInt, IsOptional, IsString } from 'class-validator';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { RestaurantPhoto } from '../models/restaurant-photo.entity';
import { serializePhoto } from '../utils/serializers';

class PhotoDto {
    @IsOptional()
    @IsInt()
    restaurant?: number;

    @IsOptional()
    @IsString()
    photo_url?: string;
}

@EntityController({
    baseRoute: '/photos',
    entity: RestaurantPhoto,
})
class RestaurantPhotoController extends BaseController {
    @Get('')
    @OpenAPI({ summary: 'Список фото', tags: ['Фото'] })
    async getAll() {
        const photos = await this.repository.find({ order: { createdAt: 'DESC' } });
        return photos.map(serializePhoto);
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Фото', tags: ['Фото'] })
    async getById(@Param('id') id: number) {
        const photo = await this.repository.findOneBy({ id });
        if (!photo) {
            throw new NotFoundError('Photo not found');
        }
        return serializePhoto(photo);
    }

    @Post('')
    @OpenAPI({ summary: 'Загрузить фото', tags: ['Фото'] })
    async create(@Body({ type: PhotoDto }) data: PhotoDto) {
        const photo = this.repository.create({
            restaurantId: data.restaurant,
            photoUrl: data.photo_url,
        });
        const saved = await this.repository.save(photo);
        return serializePhoto(saved);
    }

    @Patch('/:id')
    @OpenAPI({ summary: 'Обновить фото', tags: ['Фото'] })
    async update(@Param('id') id: number, @Body({ type: PhotoDto }) data: PhotoDto) {
        const photo = await this.repository.findOneBy({ id });
        if (!photo) {
            throw new NotFoundError('Photo not found');
        }

        if (data.photo_url !== undefined) photo.photoUrl = data.photo_url;
        if (data.restaurant !== undefined) photo.restaurantId = data.restaurant;

        await this.repository.save(photo);
        return serializePhoto(photo);
    }

    @Delete('/:id')
    @HttpCode(204)
    @OpenAPI({ summary: 'Удалить фото', tags: ['Фото'] })
    async delete(@Param('id') id: number) {
        const photo = await this.repository.findOneBy({ id });
        if (!photo) {
            throw new NotFoundError('Photo not found');
        }
        await this.repository.remove(photo);
    }
}

export default RestaurantPhotoController;
