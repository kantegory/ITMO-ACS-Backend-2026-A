import {
    Body,
    Delete,
    ForbiddenError,
    Get,
    JsonController,
    NotFoundError,
    Param,
    Post,
    Put,
    Req,
    UseBefore,
} from 'routing-controllers';
import { IsDateString, IsInt, Max, Min } from 'class-validator';

import ConflictError from '../common/conflict-error';
import dataSource from '../config/data-source';
import { UserRole } from '../enums/role.enum';
import { AuthMiddleware, RequestWithUser } from '../middlewares/auth.middleware';
import { Discount } from '../models/discount.entity';
import { Service } from '../models/service.entity';
import { successResponse } from '../utils/response';
import { serializeDiscount } from '../utils/serializers';

class DiscountDto {
    @IsInt()
    @Min(1)
    @Max(100)
    percentage: number;

    @IsDateString()
    start_at: string;

    @IsDateString()
    end_at: string;
}

@JsonController()
@UseBefore(AuthMiddleware)
class DiscountsController {
    private discountRepository = dataSource.getRepository(Discount);

    private serviceRepository = dataSource.getRepository(Service);

    private async loadDiscount(id: number) {
        return this.discountRepository.findOne({
            where: { id },
            relations: {
                service: {
                    company: {
                        owner: true,
                    },
                },
            },
        });
    }

    private async loadService(id: number) {
        return this.serviceRepository.findOne({
            where: { id },
            relations: {
                company: {
                    owner: true,
                },
                discount: true,
            },
        });
    }

    private ensureCanManage(user: RequestWithUser['user'], ownerId: number) {
        if (user.role === UserRole.ADMIN || user.id === ownerId) {
            return;
        }

        throw new ForbiddenError('Access denied');
    }

    @Get('/services/:serviceId/discount')
    async getByService(@Param('serviceId') serviceId: number) {
        const service = await this.loadService(Number(serviceId));

        if (!service?.discount) {
            throw new NotFoundError('Discount not found');
        }

        const discount = await this.loadDiscount(service.discount.id);

        return successResponse(serializeDiscount(discount!));
    }

    @Post('/services/:serviceId/discount')
    async create(
        @Param('serviceId') serviceId: number,
        @Req() req: RequestWithUser,
        @Body({ validate: true, type: DiscountDto }) body: DiscountDto,
    ) {
        const service = await this.loadService(Number(serviceId));

        if (!service) {
            throw new NotFoundError('Service not found');
        }

        this.ensureCanManage(req.user, service.company.owner.id);

        if (service.discount) {
            throw new ConflictError('Service already has a discount');
        }

        const discount = this.discountRepository.create({
            service,
            percentage: body.percentage,
            startAt: new Date(body.start_at),
            endAt: new Date(body.end_at),
        });

        const createdDiscount = await this.discountRepository.save(discount);
        const loadedDiscount = await this.loadDiscount(createdDiscount.id);

        return successResponse(serializeDiscount(loadedDiscount!));
    }

    @Put('/discounts/:id')
    async update(
        @Param('id') id: number,
        @Req() req: RequestWithUser,
        @Body({ validate: true, type: DiscountDto }) body: DiscountDto,
    ) {
        const discount = await this.loadDiscount(Number(id));

        if (!discount) {
            throw new NotFoundError('Discount not found');
        }

        this.ensureCanManage(req.user, discount.service.company.owner.id);

        discount.percentage = body.percentage;
        discount.startAt = new Date(body.start_at);
        discount.endAt = new Date(body.end_at);

        const updatedDiscount = await this.discountRepository.save(discount);

        return successResponse(serializeDiscount(updatedDiscount));
    }

    @Delete('/discounts/:id')
    async remove(@Param('id') id: number, @Req() req: RequestWithUser) {
        const discount = await this.loadDiscount(Number(id));

        if (!discount) {
            throw new NotFoundError('Discount not found');
        }

        this.ensureCanManage(req.user, discount.service.company.owner.id);
        await this.discountRepository.remove(discount);

        return successResponse({}, 'Discount deleted');
    }
}

export default DiscountsController;
