package login

import (
	"context"

	"github.com/borodin-maksim/restaurant-booking/auth-service/internal/domain"
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

func (uc *UseCase) Login(ctx context.Context, req Request) (*domain.User, error) {
	if req.Email == "" || req.Password == "" {
		return nil, domain.ErrInvalidRequest
	}

	u, err := uc.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, domain.ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
		return nil, domain.ErrInvalidCredentials
	}

	return u, nil
}
