import { Get, Patch, Param, Body, UseBefore, NotFoundError } from 'routing-controllers';

import EntityController from '../../../shared/entity-controller';
import BaseController from '../../../shared/base-controller';
import { internalGuard } from '../../../shared/internal-client';

import dataSource from '../data-source';
import { Property } from '../models/property.entity';
import { UpdateStatusDto } from '../dto/catalog.dto';

@EntityController({ baseRoute: '/internal/properties', entity: Property, dataSource })
@UseBefore(internalGuard)
class CatalogInternalController extends BaseController {
    // Используется Booking Service: получить цену, владельца и статус объекта
    @Get('/:id')
    async getProperty(@Param('id') id: number) {
        const p = await this.repository.findOneBy({ id });
        if (!p) throw new NotFoundError('Объект не найден');
        return { id: p.id, ownerId: p.ownerId, title: p.title, pricePerDay: p.pricePerDay, status: p.status };
    }

    // Booking Service переводит объект в rented/available
    @Patch('/:id/status')
    async setStatus(@Param('id') id: number, @Body() data: UpdateStatusDto) {
        const p = await this.repository.findOneBy({ id });
        if (!p) throw new NotFoundError('Объект не найден');
        p.status = data.status;
        await this.repository.save(p);
        return { id: p.id, ownerId: p.ownerId, title: p.title, pricePerDay: p.pricePerDay, status: p.status };
    }
}

export default CatalogInternalController;
