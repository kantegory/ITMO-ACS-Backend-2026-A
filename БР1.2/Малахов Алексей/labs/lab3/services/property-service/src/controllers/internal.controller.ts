import { Get, Patch, Body, Param, Res, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsEnum } from 'class-validator';
import { JsonController } from 'routing-controllers';
import { Response } from 'express';

import serviceAuthMiddleware from '../middlewares/service-auth.middleware';
import dataSource from '../config/data-source';
import { Property } from '../models/property.entity';
import { PropertyStatus } from '../models/enums';

const VALID_TRANSITIONS: Record<PropertyStatus, PropertyStatus[]> = {
    [PropertyStatus.ACTIVE]: [PropertyStatus.RENTED, PropertyStatus.ARCHIVED],
    [PropertyStatus.RENTED]: [PropertyStatus.ACTIVE, PropertyStatus.ARCHIVED],
    [PropertyStatus.ARCHIVED]: [PropertyStatus.ACTIVE],
};

class UpdateStatusDto {
    @IsEnum(PropertyStatus) status: PropertyStatus;
}

@JsonController('/internal/properties')
class InternalPropertyController {
    @Get('/:id')
    @UseBefore(serviceAuthMiddleware)
    @OpenAPI({ summary: 'Получить данные объекта (internal)' })
    async getProperty(@Param('id') id: number, @Res() res: Response) {
        const property = await dataSource.getRepository(Property).findOneBy({ id });
        if (!property) return res.status(404).json({ code: 'NOT_FOUND', message: `Property with id ${id} not found` });
        return res.json({
            id: property.id, owner_id: property.ownerId, title: property.title,
            type: property.type, status: property.status,
            price_per_month: property.pricePerMonth, currency: property.currency,
            city: property.city,
        });
    }

    @Patch('/:id/status')
    @UseBefore(serviceAuthMiddleware)
    @OpenAPI({ summary: 'Обновить статус объекта (internal)' })
    async updateStatus(@Param('id') id: number, @Body({ type: UpdateStatusDto }) dto: UpdateStatusDto, @Res() res: Response) {
        const repo = dataSource.getRepository(Property);
        const property = await repo.findOneBy({ id });
        if (!property) return res.status(404).json({ code: 'NOT_FOUND', message: `Property with id ${id} not found` });

        const allowed = VALID_TRANSITIONS[property.status] ?? [];
        if (!allowed.includes(dto.status)) {
            return res.status(422).json({ code: 'UNPROCESSABLE_ENTITY', message: `Cannot transition from '${property.status}' to '${dto.status}'` });
        }

        property.status = dto.status;
        await repo.save(property);
        return res.json({ id: property.id, status: property.status });
    }
}

export default InternalPropertyController;
