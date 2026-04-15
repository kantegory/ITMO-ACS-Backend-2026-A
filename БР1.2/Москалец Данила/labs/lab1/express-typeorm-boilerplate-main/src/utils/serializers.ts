import { Company } from '../models/company.entity';
import { Category } from '../models/category.entity';
import { Discount } from '../models/discount.entity';
import { Favorite } from '../models/favorite.entity';
import { Review } from '../models/review.entity';
import { ServiceRequest } from '../models/service-request.entity';
import { Service } from '../models/service.entity';
import { User } from '../models/user.entity';
import { isDiscountActive } from './date';

function round(value: number): number {
    return Number(value.toFixed(2));
}

export function serializeUser(user: User) {
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.firstName,
        last_name: user.lastName,
        middle_name: user.middleName ?? null,
        is_verified: user.isVerified,
    };
}

export function serializeCategory(category: Category) {
    return {
        id: category.id,
        title: category.title,
        is_published: category.isPublished,
    };
}

export function getDiscountPercentage(discount?: Discount | null): number {
    if (!discount || !isDiscountActive(discount.startAt, discount.endAt)) {
        return 0;
    }

    return discount.percentage;
}

export function getServiceFinalPrice(service: Service): number {
    const price = Number(service.price);
    const discountPercentage = getDiscountPercentage(service.discount);

    return round(price * (1 - discountPercentage / 100));
}

export function getServiceAverageRating(service: Service): number {
    const reviews = service.reviews ?? [];

    if (!reviews.length) {
        return 0;
    }

    const average =
        reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    return round(average);
}

export function serializeService(service: Service) {
    return {
        id: service.id,
        company_id: service.company.id,
        company_title: service.company.title,
        name: service.name,
        description: service.description ?? null,
        price: Number(service.price),
        final_price: getServiceFinalPrice(service),
        discount_percentage: getDiscountPercentage(service.discount),
        is_published: service.isPublished,
        categories: (service.categories ?? []).map(serializeCategory),
        avg_rating: getServiceAverageRating(service),
    };
}

export function getCompanyReviews(company: Company): Review[] {
    return (company.services ?? []).flatMap((service) => service.reviews ?? []);
}

export function getCompanyAverageRating(company: Company): number {
    const reviews = getCompanyReviews(company);

    if (!reviews.length) {
        return 0;
    }

    const average =
        reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    return round(average);
}

export function serializeCompany(company: Company) {
    const reviews = getCompanyReviews(company);

    return {
        id: company.id,
        title: company.title,
        description: company.description ?? null,
        logo: company.logo ?? null,
        website: company.website ?? null,
        avg_rating: getCompanyAverageRating(company),
        total_reviews: reviews.length,
        created_at: company.createdAt,
    };
}

export function serializeReview(review: Review) {
    return {
        id: review.id,
        service_id: review.service.id,
        service_name: review.service.name,
        company_id: review.service.company.id,
        company_title: review.service.company.title,
        user: {
            id: review.user.id,
            first_name: review.user.firstName,
            last_name: review.user.lastName,
        },
        rating: review.rating,
        comment: review.comment ?? null,
        created_at: review.createdAt,
    };
}

export function serializeRequest(request: ServiceRequest) {
    return {
        id: request.id,
        service: {
            id: request.service.id,
            name: request.service.name,
            company: {
                id: request.service.company.id,
                title: request.service.company.title,
            },
        },
        user: {
            id: request.user.id,
            first_name: request.user.firstName,
            last_name: request.user.lastName,
        },
        status: request.status,
        description: request.description ?? null,
        reply: request.reply ?? null,
        created_at: request.createdAt,
    };
}

export function serializeDiscount(discount: Discount) {
    return {
        id: discount.id,
        service_id: discount.service.id,
        percentage: discount.percentage,
        start_at: discount.startAt,
        end_at: discount.endAt,
    };
}

export function serializeFavorite(favorite: Favorite) {
    return {
        service_id: favorite.service.id,
        name: favorite.service.name,
        company: {
            id: favorite.service.company.id,
            title: favorite.service.company.title,
        },
        price: Number(favorite.service.price),
        final_price: getServiceFinalPrice(favorite.service),
        added_at: favorite.createdAt,
    };
}

export function serializeCompanyDetail(company: Company) {
    const reviews = getCompanyReviews(company);

    return {
        ...serializeCompany(company),
        owner: {
            id: company.owner.id,
            first_name: company.owner.firstName,
            last_name: company.owner.lastName,
        },
        services: (company.services ?? []).map(serializeService),
        reviews: reviews.map(serializeReview),
    };
}
