package create

import (
	"context"
	"time"

	"github.com/google/uuid"

	"restaurant-booking/catalog-service/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, userID uuid.UUID, restaurantID uuid.UUID, rating int, text string, authorName string) (domain.Review, error)
	GetName(ctx context.Context, userID uuid.UUID) (string, error)
	UpsertUser(ctx context.Context, userID uuid.UUID, fullName string, updatedAt time.Time) error
}

type Usecase struct {
	repo Repository
}

func NewUsecase(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

func (u *Usecase) Create(ctx context.Context, input Input) (Output, error) {
	rid, err := uuid.Parse(input.RestaurantID)
	if err != nil {
		return Output{}, domain.ErrInvalidInput
	}
	authorName, err := u.repo.GetName(ctx, input.UserID)
	if err != nil {
		return Output{}, err
	}
	rev, err := u.repo.Create(ctx, input.UserID, rid, input.Rating, input.Text, authorName)
	if err != nil {
		return Output{}, err
	}
	return Output{Review: rev}, nil
}
