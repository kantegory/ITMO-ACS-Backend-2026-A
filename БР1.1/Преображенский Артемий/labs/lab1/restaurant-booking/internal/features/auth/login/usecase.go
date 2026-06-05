package login

import (
	"context"
	"errors"
	"strings"

	"golang.org/x/crypto/bcrypt"

	"restaurant-booking/internal/domain"
	"restaurant-booking/pkg/jwt"
)

type Repository interface {
	FindForLogin(ctx context.Context, email domain.Email) (domain.User, error)
}

type Usecase struct {
	repo   Repository
	jwtCfg jwt.Config
}

func NewUsecase(repo Repository, jwtCfg jwt.Config) *Usecase {
	return &Usecase{repo: repo, jwtCfg: jwtCfg}
}

func (u *Usecase) Login(ctx context.Context, input Input) (Output, error) {
	email := strings.TrimSpace(input.Email)
	if email == "" || input.Password == "" {
		return Output{}, domain.ErrInvalidInput
	}
	user, err := u.repo.FindForLogin(ctx, domain.Email(email))
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return Output{}, domain.ErrUnauthorized
		}
		return Output{}, err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		return Output{}, domain.ErrUnauthorized
	}
	profile := user
	profile.Password = ""
	token, err := jwt.Sign(u.jwtCfg, user.ID)
	if err != nil {
		return Output{}, err
	}
	return Output{Token: token, User: profile}, nil
}
