import {
    Body,
    NotFoundError,
    Post,
    Req,
    UseBefore,
} from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

import { Review } from '../models/review.entity';
import { Property } from '../models/property.entity';

@EntityController({
    baseRoute: '/reviews',
    entity: Review,
})
class ReviewsController extends BaseController {
    @UseBefore(authMiddleware)
    @Post('')
    async create(
        @Req() request: RequestWithUser,
        @Body() body: { property_id: number; rating: number; comment: string },
    ): Promise<{ id: number }> {
        const { user } = request;

        const propertyRepo = dataSource.getRepository(Property);
        const property = await propertyRepo.findOneBy({ id: body.property_id });
        if (!property) throw new NotFoundError('Property not found');

        const created = this.repository.create({
            property_id: body.property_id,
            rating: body.rating,
            comment: body.comment,
            user_id: user.id,
        });
        const saved = await this.repository.save(created);
        return { id: saved.id };
    }
}

export default ReviewsController;

