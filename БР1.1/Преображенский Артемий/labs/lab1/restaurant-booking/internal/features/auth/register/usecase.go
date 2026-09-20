package register

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"restaurant-booking/internal/domain"
	"restaurant-booking/pkg/jwt"
)

type Repository interface {
	Create(ctx context.Context, email domain.Email, passwordHash string, fullName string, phone domain.Phone) (uuid.UUID, error)
	GetByID(ctx context.Context, id uuid.UUID) (domain.User, error)
}

type Usecase struct {
	repo   Repository
	jwtCfg jwt.Config
}

func NewUsecase(repo Repository, jwtCfg jwt.Config) *Usecase {
	return &Usecase{repo: repo, jwtCfg: jwtCfg}
}

func (u *Usecase) Register(ctx context.Context, input Input) (Output, error) {
	email := strings.TrimSpace(input.Email)
	fullName := strings.TrimSpace(input.FullName)
	if email == "" || fullName == "" || input.Password == "" {
		return Output{}, domain.ErrInvalidInput
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return Output{}, err
	}
	id, err := u.repo.Create(ctx, domain.Email(email), string(hash), fullName, domain.Phone(strings.TrimSpace(input.Phone)))
	if err != nil {
		return Output{}, err
	}
	user, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return Output{}, err
	}
	token, err := jwt.Sign(u.jwtCfg, id)
	if err != nil {
		return Output{}, err
	}
	return Output{Token: token, User: user}, nil
}
