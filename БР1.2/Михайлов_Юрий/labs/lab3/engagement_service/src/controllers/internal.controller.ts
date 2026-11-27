import { JsonController, Get, Param } from 'routing-controllers';
import dataSource from '../config/data-source';
import { Review } from '../models/review.entity';
import { Conversation } from '../models/conversation.entity';
import {OpenAPI} from "routing-controllers-openapi";

@JsonController('/internal')
export class InternalEngagementController {

    // Получить отзывы по property_id
    @Get('/reviews/property/:propertyId')
    @OpenAPI({ deprecated: true })
    async getReviewsByProperty(@Param('propertyId') propertyId: number) {
        const reviewRepo = dataSource.getRepository(Review);
        const reviews = await reviewRepo.find({
            where: { property_id: propertyId }
        });

        return reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            user_id: review.user_id,
            property_id: review.property_id
        }));
    }

    // Получить чаты по property_id
    @Get('/conversations/property/:propertyId')
    @OpenAPI({ deprecated: true })
    async getConversationsByProperty(@Param('propertyId') propertyId: number) {
        const conversationRepo = dataSource.getRepository(Conversation);
        const conversations = await conversationRepo.find({
            where: { property_id: propertyId }
        });

        return conversations.map(conv => ({
            id: conv.id,
            user1_id: conv.user1_id,
            user2_id: conv.user2_id,
            property_id: conv.property_id
        }));
    }

}
