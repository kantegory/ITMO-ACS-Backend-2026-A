import { SETTINGS } from '../../common/settings';
import { serviceRequest } from '../../common/http-client';
import { Review } from './review.entity';

const toIsoString = (value?: Date | null) => (value ? value.toISOString() : null);

export const serializeReview = async (review: Review, requestId?: string) => {
    const userResponse = await serviceRequest<any>(
        SETTINGS.IDENTITY_SERVICE_URL,
        `/internal/users/${review.userId}/summary`,
        { requestId },
    ).catch(() => ({ data: { id: review.userId } }));

    return {
        id: review.id,
        restaurantId: review.restaurantId,
        user: userResponse.data,
        rating: review.rating,
        comment: review.comment,
        createdAt: toIsoString(review.createdAt),
        updatedAt: toIsoString(review.updatedAt),
    };
};
