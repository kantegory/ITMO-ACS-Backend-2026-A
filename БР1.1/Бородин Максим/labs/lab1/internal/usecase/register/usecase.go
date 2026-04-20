package register

import (
	"context"
	"time"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type Request struct {
	Email    string
	Password string
}

type UseCase struct {
	userRepo userRepository
}

func New(userRepo userRepository) *UseCase {
	return &UseCase{userRepo: userRepo}
}

func (uc *UseCase) Register(ctx context.Context, req Request) (*domain.User, error) {
	if req.Email == "" || len(req.Password) < 6 {
		return nil, domain.ErrInvalidRequest
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	u := &domain.User{
		ID:           uuid.New().String(),
		Email:        req.Email,
		PasswordHash: string(hash),
		Role:         domain.RoleUser,
		CreatedAt:    time.Now().UTC(),
	}

	if err := uc.userRepo.Create(ctx, u); err != nil {
		return nil, err
	}
	return u, nil
}
