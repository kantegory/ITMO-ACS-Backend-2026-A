import { Get, JsonController, QueryParams, Req, UseBefore } from 'routing-controllers';

import dataSource from '../config/data-source';
import { AuthMiddleware, RequestWithUser } from '../middlewares/auth.middleware';
import { Company } from '../models/company.entity';
import { Review } from '../models/review.entity';
import { ServiceRequest } from '../models/service-request.entity';
import { getPagination } from '../utils/pagination';
import { paginatedResponse, successResponse } from '../utils/response';
import {
    serializeCompanyDetail,
    serializeRequest,
    serializeReview,
} from '../utils/serializers';

@JsonController('/me')
@UseBefore(AuthMiddleware)
class MeController {
    private companyRepository = dataSource.getRepository(Company);

    private reviewRepository = dataSource.getRepository(Review);

    private requestRepository = dataSource.getRepository(ServiceRequest);

    @Get('/company')
    async getMyCompany(@Req() req: RequestWithUser) {
        const company = await this.companyRepository.findOne({
            where: {
                owner: { id: req.user.id },
            },
            relations: {
                owner: true,
                services: {
                    company: true,
                    categories: true,
                    discount: true,
                    reviews: true,
                },
            },
        });

        if (!company) {
            return {
                data: null,
            };
        }

        return successResponse(serializeCompanyDetail(company));
    }

    @Get('/reviews')
    async getMyReviews(@Req() req: RequestWithUser, @QueryParams() query: any) {
        const { limit, offset } = getPagination(query);
        const [reviews, total] = await this.reviewRepository.findAndCount({
            where: {
                user: { id: req.user.id },
            },
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
            reviews.map(serializeReview),
            total,
            offset,
            limit,
        );
    }

    @Get('/requests')
    async getMyRequests(@Req() req: RequestWithUser, @QueryParams() query: any) {
        const { limit, offset } = getPagination(query);
        const where: any = {
            user: { id: req.user.id },
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

export default MeController;
