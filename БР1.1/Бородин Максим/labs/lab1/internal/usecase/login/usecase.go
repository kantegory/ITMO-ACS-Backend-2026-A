package login

import (
	"context"
	"errors"
	"time"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type Request struct {
	Email     string
	Password  string
	JWTSecret string
}

type UseCase struct {
	userRepo userRepository
}

func New(userRepo userRepository) *UseCase {
	return &UseCase{userRepo: userRepo}
}

func (uc *UseCase) Login(ctx context.Context, req Request) (string, error) {
	u, err := uc.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return "", domain.ErrInvalidCredentials
		}
		return "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
		return "", domain.ErrInvalidCredentials
	}

	claims := jwt.MapClaims{
		"user_id": u.ID,
		"role":    u.Role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(req.JWTSecret))
	if err != nil {
		return "", err
	}
	return signed, nil
}
