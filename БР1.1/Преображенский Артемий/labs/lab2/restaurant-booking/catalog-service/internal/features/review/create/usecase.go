package create

import (
	"context"

	"github.com/google/uuid"

	"restaurant-booking/catalog-service/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, userID uuid.UUID, restaurantID uuid.UUID, rating int, text string, authorName string) (domain.Review, error)
}

type AuthClient interface {
	GetUserName(ctx context.Context, userID uuid.UUID) (string, error)
}

type Usecase struct {
	repo       Repository
	authClient AuthClient
}

func NewUsecase(repo Repository, authClient AuthClient) *Usecase {
	return &Usecase{repo: repo, authClient: authClient}
}

func (u *Usecase) Create(ctx context.Context, input Input) (Output, error) {
	rid, err := uuid.Parse(input.RestaurantID)
	if err != nil {
		return Output{}, domain.ErrInvalidInput
	}
	authorName, err := u.authClient.GetUserName(ctx, input.UserID)
	if err != nil {
		return Output{}, err
	}
	rev, err := u.repo.Create(ctx, input.UserID, rid, input.Rating, input.Text, authorName)
	if err != nil {
		return Output{}, err
	}
	return Output{Review: rev}, nil
}
