package services

import (
	"errors"
	"rental-service/internal/dto"
	"rental-service/internal/models"
	"rental-service/internal/repository"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	UserRepo *repository.UserRepository
}

func (s *AuthService) Register(req dto.RegisterRequest) (*models.User, error) {
	// role check
	role := models.Role(req.Role)
	if !role.IsValid() {
		return nil, errors.New("invalid role")
	}

	// existing check
	existing, _ := s.UserRepo.GetByEmail(req.Email)
	if existing.ID != 0 {
		return nil, errors.New("user already exists")
	}

	// password hash
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := models.User{
		Email:      req.Email,
		Password:   string(hash),
		FirstName:  req.FirstName,
		LastName:   req.LastName,
		Role:       role,
		IsActive:   true,
		IsVerified: false,
	}

	err = s.UserRepo.Create(&user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

type TokenClaims struct {
	UserID uint        `json:"user_id"`
	Role   models.Role `json:"role"`
	jwt.RegisteredClaims
}

func (s *AuthService) Login(req dto.LoginRequest, jwtSecret string) (*dto.LoginResponse, error) {
	user, err := s.UserRepo.GetByEmail(req.Email)
	if err != nil || user.ID == 0 {
		return nil, errors.New("invalid credentials")
	}
	if !user.IsActive {
		return nil, errors.New("user is inactive")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	now := time.Now()
	claims := TokenClaims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(24 * time.Hour)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return nil, err
	}

	resp := &dto.LoginResponse{
		AccessToken: signed,
		User: dto.UserResponse{
			ID:         user.ID,
			Email:      user.Email,
			FirstName:  user.FirstName,
			LastName:   user.LastName,
			Role:       string(user.Role),
			IsVerified: user.IsVerified,
			IsActive:   user.IsActive,
		},
	}
	return resp, nil
}
