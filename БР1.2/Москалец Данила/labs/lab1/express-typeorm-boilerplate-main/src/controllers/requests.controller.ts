import {
    BadRequestError,
    Body,
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
import { IsOptional, IsString } from 'class-validator';

import dataSource from '../config/data-source';
import { RequestStatus } from '../enums/request-status.enum';
import { UserRole } from '../enums/role.enum';
import { AuthMiddleware, RequestWithUser } from '../middlewares/auth.middleware';
import { Company } from '../models/company.entity';
import { ServiceRequest } from '../models/service-request.entity';
import { Service } from '../models/service.entity';
import { User } from '../models/user.entity';
import { getPagination } from '../utils/pagination';
import { paginatedResponse, successResponse } from '../utils/response';
import { serializeRequest } from '../utils/serializers';

class CreateRequestDto {
    @IsOptional()
    @IsString()
    description?: string;
}

class UpdateStatusDto {
    @IsString()
    status: RequestStatus.ACCEPTED | RequestStatus.REJECTED;

    @IsOptional()
    @IsString()
    reply?: string;
}

@JsonController()
@UseBefore(AuthMiddleware)
class RequestsController {
    private companyRepository = dataSource.getRepository(Company);

    private serviceRepository = dataSource.getRepository(Service);

    private requestRepository = dataSource.getRepository(ServiceRequest);

    private userRepository = dataSource.getRepository(User);

    private async loadRequest(id: number) {
        return this.requestRepository.findOne({
            where: { id },
            relations: {
                user: true,
                service: {
                    company: {
                        owner: true,
                    },
                },
            },
        });
    }

    @Get('/companies/:companyId/requests')
    async companyRequests(
        @Param('companyId') companyId: number,
        @Req() req: RequestWithUser,
        @QueryParams() query: any,
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

        const { limit, offset } = getPagination(query);
        const queryBuilder = this.requestRepository
            .createQueryBuilder('request')
            .leftJoinAndSelect('request.user', 'user')
            .leftJoinAndSelect('request.service', 'service')
            .leftJoinAndSelect('service.company', 'company')
            .where('company.id = :companyId', { companyId: company.id })
            .orderBy('request.createdAt', 'DESC')
            .skip(offset)
            .take(limit);

        if (query.status) {
            queryBuilder.andWhere('request.status = :status', {
                status: query.status,
            });
        }

        const [requests, total] = await queryBuilder.getManyAndCount();

        return paginatedResponse(
            requests.map(serializeRequest),
            total,
            offset,
            limit,
        );
    }

    @Post('/services/:serviceId/create_requests')
    async create(
        @Param('serviceId') serviceId: number,
        @Req() req: RequestWithUser,
        @Body({ validate: true, type: CreateRequestDto }) body: CreateRequestDto,
    ) {
        const service = await this.serviceRepository.findOne({
            where: { id: Number(serviceId) },
            relations: {
                company: {
                    owner: true,
                },
            },
        });

        if (!service) {
            throw new NotFoundError('Service not found');
        }

        if (service.company.owner.id === req.user.id) {
            throw new ForbiddenError('Cannot create request for your own service');
        }

        const user = await this.userRepository.findOneByOrFail({ id: req.user.id });
        const request = this.requestRepository.create({
            service,
            user,
            description: body.description,
            status: RequestStatus.PENDING,
        });

        const createdRequest = await this.requestRepository.save(request);
        const loadedRequest = await this.loadRequest(createdRequest.id);

        return successResponse(serializeRequest(loadedRequest!));
    }

    @Put('/requests/:id/status')
    async updateStatus(
        @Param('id') id: number,
        @Req() req: RequestWithUser,
        @Body({ validate: true, type: UpdateStatusDto }) body: UpdateStatusDto,
    ) {
        const request = await this.loadRequest(Number(id));

        if (!request) {
            throw new NotFoundError('Request not found');
        }

        if (
            req.user.role !== UserRole.ADMIN &&
            request.service.company.owner.id !== req.user.id
        ) {
            throw new ForbiddenError('Access denied');
        }

        if (
            ![RequestStatus.ACCEPTED, RequestStatus.REJECTED].includes(body.status)
        ) {
            throw new BadRequestError('Invalid status');
        }

        request.status = body.status;
        request.reply = body.reply;

        const updatedRequest = await this.requestRepository.save(request);

        return successResponse(serializeRequest(updatedRequest));
    }

    @Put('/requests/:id/cancel')
    async cancel(@Param('id') id: number, @Req() req: RequestWithUser) {
        const request = await this.loadRequest(Number(id));

        if (!request) {
            throw new NotFoundError('Request not found');
        }

        if (
            req.user.role !== UserRole.ADMIN &&
            request.user.id !== req.user.id
        ) {
            throw new ForbiddenError('Access denied');
        }

        if (request.status !== RequestStatus.PENDING) {
            throw new BadRequestError('Request cannot be cancelled');
        }

        request.status = RequestStatus.CANCELLED;
        const updatedRequest = await this.requestRepository.save(request);

        return successResponse(serializeRequest(updatedRequest));
    }
}

export default RequestsController;
