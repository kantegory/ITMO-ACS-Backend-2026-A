export function getAverageRating(reviews: { rating: number }[]): number {
    if (!reviews || reviews.length === 0) {
        return 0;
    }
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / reviews.length) * 100) / 100;
}

export function getCuisineNames(restaurant: {
    restaurantCuisines?: { cuisineType?: { name: string } }[];
}): string[] {
    if (!restaurant.restaurantCuisines) {
        return [];
    }
    return restaurant.restaurantCuisines
        .map((rc) => rc.cuisineType?.name)
        .filter(Boolean);
}

export function serializeRestaurantList(restaurant: any) {
    return {
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        price_range: restaurant.priceRange,
        district: restaurant.district,
        cuisines: getCuisineNames(restaurant),
        average_rating: getAverageRating(restaurant.reviews || []),
    };
}

export function serializeRestaurantDetail(restaurant: any) {
    return {
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description,
        address: restaurant.address,
        price_range: restaurant.priceRange,
        district: restaurant.district,
        created_at: restaurant.createdAt,
        cuisines: getCuisineNames(restaurant),
        menu_items: (restaurant.menuItems || []).map(serializeMenuItem),
        photos: (restaurant.photos || []).map(serializePhoto),
        average_rating: getAverageRating(restaurant.reviews || []),
    };
}

export function serializeMenuItem(item: any) {
    return {
        id: item.id,
        restaurant: item.restaurantId,
        name: item.name,
        description: item.description,
        price: Number(item.price),
    };
}

export function serializePhoto(photo: any) {
    return {
        id: photo.id,
        restaurant: photo.restaurantId,
        photo_url: photo.photoUrl,
        created_at: photo.createdAt,
    };
}

export function serializeReview(review: any) {
    return {
        id: review.id,
        user: review.userId,
        user_name: review.user?.firstName,
        restaurant: review.restaurantId,
        rating: review.rating,
        comment: review.comment,
        created_at: review.createdAt,
    };
}

export function serializeReservation(reservation: any) {
    return {
        id: reservation.id,
        user: reservation.userId,
        user_name: reservation.user?.firstName,
        restaurant: reservation.restaurantId,
        restaurant_name: reservation.restaurant?.name,
        start_time: reservation.startTime,
        guest_count: reservation.guestCount,
        status: reservation.status,
        created_at: reservation.createdAt,
    };
}

export function serializeUser(user: any) {
    return {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        middle_name: user.middleName,
        email: user.email,
        role: user.roleId,
        role_name: user.role?.name,
        created_at: user.createdAt,
    };
}
