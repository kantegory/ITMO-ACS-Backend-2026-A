package addreview

import (
	"context"
	"time"

	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/domain"
	"github.com/google/uuid"
)

type Request struct {
	UserID       string
	RestaurantID string
	Rating       int
	Comment      string
}

type UseCase struct {
	reviewRepo     reviewRepository
	restaurantRepo restaurantRepository
}

func New(reviewRepo reviewRepository, restaurantRepo restaurantRepository) *UseCase {
	return &UseCase{reviewRepo: reviewRepo, restaurantRepo: restaurantRepo}
}

func (uc *UseCase) Add(ctx context.Context, req Request) (*domain.Review, error) {
	if req.Rating < 1 || req.Rating > 5 {
		return nil, domain.ErrInvalidRequest
	}

	exists, err := uc.restaurantRepo.ExistsByID(ctx, req.RestaurantID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, domain.ErrNotFound
	}

	alreadyReviewed, err := uc.reviewRepo.ExistsByUserAndRestaurant(ctx, req.UserID, req.RestaurantID)
	if err != nil {
		return nil, err
	}
	if alreadyReviewed {
		return nil, domain.ErrReviewAlreadyExists
	}

	rv := &domain.Review{
		ID:           uuid.New().String(),
		UserID:       req.UserID,
		RestaurantID: req.RestaurantID,
		Rating:       req.Rating,
		Comment:      req.Comment,
		CreatedAt:    time.Now().UTC(),
	}

	if err := uc.reviewRepo.Create(ctx, rv); err != nil {
		return nil, err
	}
	return rv, nil
}
