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
    QueryParams,
    Req,
    UseBefore,
} from 'routing-controllers';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

import dataSource from '../config/data-source';
import { UserRole } from '../enums/role.enum';
import { AuthMiddleware, RequestWithUser } from '../middlewares/auth.middleware';
import { Category } from '../models/category.entity';
import { Company } from '../models/company.entity';
import { ServiceRequest } from '../models/service-request.entity';
import { Service } from '../models/service.entity';
import { getPagination } from '../utils/pagination';
import { paginatedResponse, successResponse } from '../utils/response';
import { serializeRequest, serializeService } from '../utils/serializers';

class ServiceDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber()
    price: number;

    @IsOptional()
    @IsBoolean()
    is_published?: boolean;

    @IsOptional()
    @IsArray()
    category_ids?: number[];
}

class UpdateServiceDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    price?: number;

    @IsOptional()
    @IsBoolean()
    is_published?: boolean;

    @IsOptional()
    @IsArray()
    category_ids?: number[];
}

@JsonController()
@UseBefore(AuthMiddleware)
class ServicesController {
    private serviceRepository = dataSource.getRepository(Service);

    private companyRepository = dataSource.getRepository(Company);

    private categoryRepository = dataSource.getRepository(Category);

    private requestRepository = dataSource.getRepository(ServiceRequest);

    private async loadService(id: number) {
        return this.serviceRepository.findOne({
            where: { id },
            relations: {
                company: {
                    owner: true,
                },
                categories: true,
                discount: true,
                reviews: true,
            },
        });
    }

    private ensureCanManageService(user: RequestWithUser['user'], service: Service) {
        if (
            user.role === UserRole.ADMIN ||
            service.company.owner.id === user.id
        ) {
            return;
        }

        throw new ForbiddenError('Access denied');
    }

    private async resolveCategories(categoryIds?: number[]) {
        if (!categoryIds?.length) {
            return [];
        }

        return this.categoryRepository.findByIds(categoryIds);
    }

    @Get('/services')
    async list(@QueryParams() query: any) {
        const { limit, offset } = getPagination(query);
        const services = await this.serviceRepository.find({
            relations: {
                company: true,
                categories: true,
                discount: true,
                reviews: true,
            },
            order: {
                createdAt: query.sort_order === 'asc' ? 'ASC' : 'DESC',
            },
        });

        let filtered = services;

        if (query.company_id) {
            filtered = filtered.filter(
                (service) => service.company.id === Number(query.company_id),
            );
        }

        if (query.category_id) {
            filtered = filtered.filter((service) =>
                service.categories.some(
                    (category) => category.id === Number(query.category_id),
                ),
            );
        }

        if (query.price_min !== undefined) {
            filtered = filtered.filter(
                (service) => Number(service.price) >= Number(query.price_min),
            );
        }

        if (query.price_max !== undefined) {
            filtered = filtered.filter(
                (service) => Number(service.price) <= Number(query.price_max),
            );
        }

        if (query.is_published !== undefined) {
            const flag = String(query.is_published) === 'true';
            filtered = filtered.filter((service) => service.isPublished === flag);
        }

        if (query.sort_by === 'price') {
            const direction = query.sort_order === 'asc' ? 1 : -1;
            filtered = filtered.sort(
                (a, b) => direction * (Number(a.price) - Number(b.price)),
            );
        }

        if (query.sort_by === 'rating') {
            const direction = query.sort_order === 'asc' ? 1 : -1;
            filtered = filtered.sort((a, b) => {
                const aRating =
                    (a.reviews ?? []).reduce((sum, review) => sum + review.rating, 0) /
                        ((a.reviews ?? []).length || 1);
                const bRating =
                    (b.reviews ?? []).reduce((sum, review) => sum + review.rating, 0) /
                        ((b.reviews ?? []).length || 1);

                return direction * (aRating - bRating);
            });
        }

        const total = filtered.length;
        const data = filtered.slice(offset, offset + limit).map(serializeService);

        return paginatedResponse(data, total, offset, limit);
    }

    @Get('/services/:id')
    async getOne(@Param('id') id: number) {
        const service = await this.loadService(Number(id));

        if (!service) {
            throw new NotFoundError('Service not found');
        }

        return successResponse(serializeService(service));
    }

    @Post('/companies/:companyId/services')
    async create(
        @Param('companyId') companyId: number,
        @Req() req: RequestWithUser,
        @Body({ validate: true, type: ServiceDto }) body: ServiceDto,
    ) {
        const company = await this.companyRepository.findOne({
            where: { id: Number(companyId) },
            relations: {
                owner: true,
            },
        });

        if (!company) {
            throw new NotFoundError('Company not found');
        }

        if (
            req.user.role !== UserRole.ADMIN &&
            company.owner.id !== req.user.id
        ) {
            throw new ForbiddenError('Access denied');
        }

        const categories = await this.resolveCategories(body.category_ids);
        const service = this.serviceRepository.create({
            company,
            name: body.name,
            description: body.description,
            price: body.price.toFixed(2),
            isPublished: body.is_published ?? false,
            categories,
        });

        const createdService = await this.serviceRepository.save(service);
        const loadedService = await this.loadService(createdService.id);

        return successResponse(serializeService(loadedService!));
    }

    @Put('/services/:id')
    async update(
        @Param('id') id: number,
        @Req() req: RequestWithUser,
        @Body({ validate: true, type: UpdateServiceDto }) body: UpdateServiceDto,
    ) {
        const service = await this.loadService(Number(id));

        if (!service) {
            throw new NotFoundError('Service not found');
        }

        this.ensureCanManageService(req.user, service);

        if (body.name !== undefined) {
            service.name = body.name;
        }

        if (body.description !== undefined) {
            service.description = body.description;
        }

        if (body.price !== undefined) {
            service.price = body.price.toFixed(2);
        }

        if (body.is_published !== undefined) {
            service.isPublished = body.is_published;
        }

        if (body.category_ids !== undefined) {
            service.categories = await this.resolveCategories(body.category_ids);
        }

        await this.serviceRepository.save(service);
        const updatedService = await this.loadService(service.id);

        return successResponse(serializeService(updatedService!));
    }

    @Delete('/services/:id')
    async remove(@Param('id') id: number, @Req() req: RequestWithUser) {
        const service = await this.loadService(Number(id));

        if (!service) {
            throw new NotFoundError('Service not found');
        }

        this.ensureCanManageService(req.user, service);
        await this.serviceRepository.remove(service);

        return successResponse({}, 'Service deleted');
    }

    @Get('/services/:serviceId/requests')
    async listServiceRequests(
        @Param('serviceId') serviceId: number,
        @Req() req: RequestWithUser,
        @QueryParams() query: any,
    ) {
        const service = await this.loadService(Number(serviceId));

        if (!service) {
            throw new NotFoundError('Service not found');
        }

        this.ensureCanManageService(req.user, service);

        const { limit, offset } = getPagination(query);
        const where: any = {
            service: { id: service.id },
        };

        if (query.status) {
            where.status = query.status;
        }

        const [requests, total] = await this.requestRepository.findAndCount({
            where,
            relations: {
                user: true,
                service: {
                    company: true,
                },
            },
            skip: offset,
            take: limit,
            order: {
                createdAt: 'DESC',
            },
        });

        return paginatedResponse(
            requests.map(serializeRequest),
            total,
            offset,
            limit,
        );
    }
}

export default ServicesController;
