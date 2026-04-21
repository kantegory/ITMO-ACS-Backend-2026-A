package me

import (
	"context"

	"github.com/google/uuid"

	"restaurant-booking/internal/domain"
)

type Repository interface {
	GetByID(ctx context.Context, id uuid.UUID) (domain.User, error)
}

type Usecase struct {
	repo Repository
}

func NewUsecase(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

func (u *Usecase) Me(ctx context.Context, input Input) (Output, error) {
	user, err := u.repo.GetByID(ctx, input.UserID)
	if err != nil {
		return Output{}, err
	}
	return Output{User: user}, nil
}
