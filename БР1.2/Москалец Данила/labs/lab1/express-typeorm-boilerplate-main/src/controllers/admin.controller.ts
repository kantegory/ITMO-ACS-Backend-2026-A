import {
    Get,
    JsonController,
    QueryParams,
    UseBefore,
} from 'routing-controllers';

import dataSource from '../config/data-source';
import { AuthMiddleware, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '../enums/role.enum';
import { Company } from '../models/company.entity';
import { Review } from '../models/review.entity';
import { ServiceRequest } from '../models/service-request.entity';
import { User } from '../models/user.entity';
import { getPagination } from '../utils/pagination';
import { paginatedResponse, successResponse } from '../utils/response';
import {
    serializeCompany,
    serializeRequest,
    serializeUser,
} from '../utils/serializers';
import { RequestStatus } from '../enums/request-status.enum';

@JsonController('/admin')
@UseBefore(AuthMiddleware, requireRole([UserRole.ADMIN]))
class AdminController {
    private userRepository = dataSource.getRepository(User);

    private companyRepository = dataSource.getRepository(Company);

    private requestRepository = dataSource.getRepository(ServiceRequest);

    private reviewRepository = dataSource.getRepository(Review);

    @Get('/users')
    async users(@QueryParams() query: any) {
        const { limit, offset } = getPagination(query);
        const [users, total] = await this.userRepository.findAndCount({
            skip: offset,
            take: limit,
            order: { id: 'ASC' },
        });

        return paginatedResponse(users.map(serializeUser), total, offset, limit);
    }

    @Get('/companies')
    async companies(@QueryParams() query: any) {
        const { limit, offset } = getPagination(query);
        const [companies, total] = await this.companyRepository.findAndCount({
            relations: {
                services: {
                    reviews: true,
                    categories: true,
                    company: true,
                    discount: true,
                },
            },
            skip: offset,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        return paginatedResponse(
            companies.map(serializeCompany),
            total,
            offset,
            limit,
        );
    }

    @Get('/requests')
    async requests(@QueryParams() query: any) {
        const { limit, offset } = getPagination(query);
        const where: any = {};

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
            order: { createdAt: 'DESC' },
        });

        return paginatedResponse(
            requests.map(serializeRequest),
            total,
            offset,
            limit,
        );
    }

    @Get('/reports/activity')
    async activity(@QueryParams() query: any) {
        const totalUsers = await this.userRepository.count();
        const totalCompanies = await this.companyRepository.count();
        const totalRequests = await this.requestRepository.count();
        const totalReviews = await this.reviewRepository.count();

        const topCompaniesRaw = await this.requestRepository
            .createQueryBuilder('request')
            .leftJoin('request.service', 'service')
            .leftJoin('service.company', 'company')
            .select('company.id', 'id')
            .addSelect('company.title', 'title')
            .addSelect('COUNT(request.id)', 'requests_count')
            .groupBy('company.id')
            .addGroupBy('company.title')
            .orderBy('COUNT(request.id)', 'DESC')
            .limit(5)
            .getRawMany();

        const requestsByStatus = {
            pending: await this.requestRepository.count({
                where: { status: RequestStatus.PENDING },
            }),
            accepted: await this.requestRepository.count({
                where: { status: RequestStatus.ACCEPTED },
            }),
            rejected: await this.requestRepository.count({
                where: { status: RequestStatus.REJECTED },
            }),
            cancelled: await this.requestRepository.count({
                where: { status: RequestStatus.CANCELLED },
            }),
        };

        return successResponse({
            total_users: totalUsers,
            total_companies: totalCompanies,
            total_requests: totalRequests,
            total_reviews: totalReviews,
            period: query.period ?? 'month',
            from: query.from ?? null,
            to: query.to ?? null,
            top_companies: topCompaniesRaw.map((company) => ({
                id: Number(company.id),
                title: company.title,
                requests_count: Number(company.requests_count),
            })),
            requests_by_status: requestsByStatus,
        });
    }
}

export default AdminController;
