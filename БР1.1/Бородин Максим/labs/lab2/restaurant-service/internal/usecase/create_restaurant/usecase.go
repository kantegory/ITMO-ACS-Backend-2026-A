package createrestaurant

import (
	"context"
	"time"

	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/domain"
	"github.com/google/uuid"
)

type Request struct {
	Name        string
	Description string
	CuisineType string
	Location    string
	PriceRange  int
}

type UseCase struct {
	restaurantRepo restaurantRepository
}

func New(restaurantRepo restaurantRepository) *UseCase {
	return &UseCase{restaurantRepo: restaurantRepo}
}

func (uc *UseCase) Create(ctx context.Context, req Request) (*domain.Restaurant, error) {
	if req.Name == "" || req.PriceRange < 1 || req.PriceRange > 3 {
		return nil, domain.ErrInvalidRequest
	}

	rest := &domain.Restaurant{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		CuisineType: req.CuisineType,
		Location:    req.Location,
		PriceRange:  req.PriceRange,
		CreatedAt:   time.Now().UTC(),
	}

	if err := uc.restaurantRepo.Create(ctx, rest); err != nil {
		return nil, err
	}
	return rest, nil
}
