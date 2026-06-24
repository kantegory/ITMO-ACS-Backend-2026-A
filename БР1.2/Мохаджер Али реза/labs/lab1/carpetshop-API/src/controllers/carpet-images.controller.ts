import {
    BadRequestError,
    Body,
    Delete,
    Get,
    NotFoundError,
    Param,
    Post,
    UseBefore,
} from 'routing-controllers';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import BaseController from '../common/base-controller';
import EntityController from '../common/entity-controller';
import authMiddleware from '../middlewares/auth.middleware';
import requireAdmin from '../middlewares/require-admin.middleware';
import dataSource from '../config/data-source';
import { Carpet } from '../models/carpet.entity';
import { CarpetImage } from '../models/carpet-image.entity';

class CarpetImageCreateDto {
    @IsString()
    @Type(() => String)
    image_url: string;

    @IsOptional()
    @IsBoolean()
    is_main?: boolean;
}

@EntityController({ baseRoute: '/carpets', entity: CarpetImage })
export default class CarpetImagesController extends BaseController {
    @Get('/:id/images')
    async list(@Param('id') id: number) {
        const carpet = await dataSource.getRepository(Carpet).findOneBy({ id });
        if (!carpet) throw new NotFoundError('Carpet not found');

        return await dataSource.getRepository(CarpetImage).find({
            where: { carpet: { id } },
            order: { created_at: 'ASC' },
            relations: { carpet: true },
        });
    }

    @Post('/:id/images')
    @UseBefore(authMiddleware, requireAdmin)
    async create(@Param('id') id: number, @Body({ type: CarpetImageCreateDto }) dto: CarpetImageCreateDto) {
        const carpet = await dataSource.getRepository(Carpet).findOneBy({ id });
        if (!carpet) throw new NotFoundError('Carpet not found');

        const imageRepo = dataSource.getRepository(CarpetImage);

        if (dto.is_main) {
            await imageRepo.update({ carpet: { id }, is_main: true }, { is_main: false });
        }

        const image = imageRepo.create({
            carpet,
            image_url: dto.image_url,
            is_main: dto.is_main ?? false,
        });

        return await imageRepo.save(image);
    }

    @Delete('/:carpet_id/images/:image_id')
    @UseBefore(authMiddleware, requireAdmin)
    async remove(@Param('carpet_id') carpet_id: number, @Param('image_id') image_id: number) {
        const imageRepo = dataSource.getRepository(CarpetImage);
        const image = await imageRepo.findOne({
            where: { id: image_id, carpet: { id: carpet_id } },
            relations: { carpet: true },
        });
        if (!image) throw new NotFoundError('Carpet or image not found');

        await imageRepo.remove(image);
        return;
    }
}

