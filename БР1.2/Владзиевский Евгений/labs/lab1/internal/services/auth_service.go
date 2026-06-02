package services

import (
	"errors"
	"rental-api/internal/config"
	"rental-api/internal/models"
	"rental-api/internal/repositories"
	"rental-api/internal/utils"
)

type AuthService interface {
	Register(input RegisterInput) (*models.User, string, string, error)
	Login(email, password string) (*models.User, string, string, error)
}

type authService struct {
	userRepo repositories.UserRepository
	cfg      *config.Config
}

type RegisterInput struct {
	Email    string
	Password string
	FullName string
	Phone    *string
	Role     string
}

func NewAuthService(userRepo repositories.UserRepository, cfg *config.Config) AuthService {
	return &authService{userRepo: userRepo, cfg: cfg}
}

func (s *authService) Register(input RegisterInput) (*models.User, string, string, error) {
	// Check if user already exists
	existing, err := s.userRepo.FindByEmail(input.Email)
	if err == nil && existing != nil {
		return nil, "", "", errors.New("user with this email already exists")
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(input.Password)
	if err != nil {
		return nil, "", "", err
	}

	// Create user
	user := &models.User{
		Email:        input.Email,
		PasswordHash: hashedPassword,
		FullName:     input.FullName,
		Phone:        input.Phone,
		Role:         input.Role,
	}
	if user.Role == "" {
		user.Role = "tenant"
	}

	err = s.userRepo.Create(user)
	if err != nil {
		return nil, "", "", err
	}

	// Generate tokens
	accessToken, refreshToken, err := utils.GenerateTokenPair(user, s.cfg.JWTSecret)
	if err != nil {
		return nil, "", "", err
	}

	return user, accessToken, refreshToken, nil
}

func (s *authService) Login(email, password string) (*models.User, string, string, error) {
	// Find user by email
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return nil, "", "", errors.New("invalid email or password")
	}

	// Verify password
	if !utils.CheckPasswordHash(password, user.PasswordHash) {
		return nil, "", "", errors.New("invalid email or password")
	}

	// Generate tokens
	accessToken, refreshToken, err := utils.GenerateTokenPair(user, s.cfg.JWTSecret)
	if err != nil {
		return nil, "", "", err
	}

	return user, accessToken, refreshToken, nil
}
