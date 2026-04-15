import {
    Body,
    Delete,
    ForbiddenError,
    Get,
    JsonController,
    NotFoundError,
    Param,
    Post,
    Req,
    UseBefore,
} from 'routing-controllers';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import dataSource from '../config/data-source';
import { RequestStatus } from '../enums/request-status.enum';
import { UserRole } from '../enums/role.enum';
import { AuthMiddleware, RequestWithUser } from '../middlewares/auth.middleware';
import { Review } from '../models/review.entity';
import { ServiceRequest } from '../models/service-request.entity';
import { Service } from '../models/service.entity';
import { User } from '../models/user.entity';
import { successResponse } from '../utils/response';
import { serializeReview } from '../utils/serializers';

class CreateReviewDto {
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @IsOptional()
    @IsString()
    comment?: string;
}

@JsonController()
class ReviewsController {
    private reviewRepository = dataSource.getRepository(Review);

    private serviceRepository = dataSource.getRepository(Service);

    private requestRepository = dataSource.getRepository(ServiceRequest);

    private userRepository = dataSource.getRepository(User);

    @Get('/services/:serviceId/reviews')
    async list(@Param('serviceId') serviceId: number) {
        const reviews = await this.reviewRepository.find({
            where: {
                service: { id: Number(serviceId) },
            },
            relations: {
                user: true,
                service: {
                    company: true,
                },
            },
            order: {
                createdAt: 'DESC',
            },
        });

        return successResponse(reviews.map(serializeReview));
    }

    @Post('/services/:serviceId/reviews')
    @UseBefore(AuthMiddleware)
    async create(
        @Param('serviceId') serviceId: number,
        @Req() req: RequestWithUser,
        @Body({ validate: true, type: CreateReviewDto }) body: CreateReviewDto,
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
            throw new ForbiddenError('Cannot review your own service');
        }

        const acceptedRequest = await this.requestRepository.findOne({
            where: {
                user: { id: req.user.id },
                service: { id: service.id },
                status: RequestStatus.ACCEPTED,
            },
        });

        if (!acceptedRequest) {
            throw new ForbiddenError('Cannot leave review');
        }

        const existingReview = await this.reviewRepository.findOne({
            where: {
                user: { id: req.user.id },
                service: { id: service.id },
            },
        });

        if (existingReview) {
            throw new ForbiddenError('Review already exists');
        }

        const user = await this.userRepository.findOneByOrFail({ id: req.user.id });
        const review = this.reviewRepository.create({
            user,
            service,
            rating: body.rating,
            comment: body.comment,
        });

        const createdReview = await this.reviewRepository.save(review);
        const loadedReview = await this.reviewRepository.findOne({
            where: { id: createdReview.id },
            relations: {
                user: true,
                service: {
                    company: true,
                },
            },
        });

        return successResponse(serializeReview(loadedReview!));
    }

    @Delete('/reviews/:id')
    @UseBefore(AuthMiddleware)
    async remove(@Param('id') id: number, @Req() req: RequestWithUser) {
        const review = await this.reviewRepository.findOne({
            where: { id: Number(id) },
            relations: {
                user: true,
                service: {
                    company: true,
                },
            },
        });

        if (!review) {
            throw new NotFoundError('Review not found');
        }

        if (req.user.role !== UserRole.ADMIN && review.user.id !== req.user.id) {
            throw new ForbiddenError('Access denied');
        }

        await this.reviewRepository.remove(review);

        return successResponse({}, 'Review deleted');
    }
}

export default ReviewsController;
