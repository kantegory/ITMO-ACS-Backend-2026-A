package services

import (
	"auth-service/internal/config"
	ekafka "auth-service/internal/kafka"
	"auth-service/internal/models"
	"auth-service/internal/repositories"
	"auth-service/internal/utils"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
)

type AuthService struct {
	userRepo   *repositories.UserRepository
	cfg        *config.Config
	outboxRepo *repositories.OutboxRepository
}

func NewAuthService(userRepo *repositories.UserRepository, cfg *config.Config, outboxRepo *repositories.OutboxRepository) *AuthService {
	return &AuthService{userRepo: userRepo, cfg: cfg, outboxRepo: outboxRepo}
}

type RegisterInput struct {
	Email    string
	Password string
	FullName string
	Phone    *string
	Role     string
}

func (s *AuthService) Register(input RegisterInput) (*models.User, string, string, error) {
	existing, err := s.userRepo.FindByEmail(input.Email)
	if err == nil && existing.ID != 0 {
		return nil, "", "", errors.New("user with this email already exists")
	}

	if input.Role == "" {
		input.Role = "tenant"
	}

	hashedPassword, err := utils.HashPassword(input.Password)
	if err != nil {
		return nil, "", "", err
	}

	user := &models.User{
		Email:        input.Email,
		PasswordHash: hashedPassword,
		FullName:     input.FullName,
		Phone:        input.Phone,
		Role:         input.Role,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, "", "", err
	}

	publishUserEvent(s.outboxRepo, user.ID, "user.registered", map[string]interface{}{
		"id":        user.ID,
		"email":     user.Email,
		"full_name": user.FullName,
		"phone":     user.Phone,
		"role":      user.Role,
	})

	accessToken, refreshToken, err := utils.GenerateTokenPair(user.ID, user.Email, user.Role, s.cfg)
	if err != nil {
		return nil, "", "", err
	}

	return user, accessToken, refreshToken, nil
}

func (s *AuthService) Login(email, password string) (*models.User, string, string, error) {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return nil, "", "", errors.New("invalid email or password")
	}

	if !utils.CheckPasswordHash(password, user.PasswordHash) {
		return nil, "", "", errors.New("invalid email or password")
	}

	accessToken, refreshToken, err := utils.GenerateTokenPair(user.ID, user.Email, user.Role, s.cfg)
	if err != nil {
		return nil, "", "", err
	}

	return user, accessToken, refreshToken, nil
}

func publishUserEvent(outboxRepo *repositories.OutboxRepository, userID uint, eventType string, data interface{}) {
	dto := ekafka.OutboxEventDTO{
		EventID:       uuid.New().String(),
		EventType:     eventType,
		AggregateType: "user",
		AggregateID:   userID,
		Timestamp:     time.Now().UTC().Format(time.RFC3339),
		Data:          data,
		Source:        "auth-service",
	}

	payload, _ := json.Marshal(dto)
	event := &models.OutboxEvent{
		AggregateType: "user",
		AggregateID:   userID,
		EventType:     eventType,
		Payload:       string(payload),
		Status:        "pending",
	}

	if err := outboxRepo.Create(nil, event); err != nil {
		// Log but don't fail the registration
	}
}
