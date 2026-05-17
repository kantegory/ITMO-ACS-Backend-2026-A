package services

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"rental-platform/services/auth-service/internal/models"
	"rental-platform/services/auth-service/internal/repository"
	"rental-platform/shared/dto/events"
	"rental-platform/shared/jwt"
	"rental-platform/shared/rabbitmq"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const (
	accessTokenTTL  = 24 * time.Hour
	refreshTokenTTL = 7 * 24 * time.Hour
)

type AuthService struct {
	Users    *repository.UserRepository
	Tokens   *repository.RefreshTokenRepository
	JWTSecret string
	Publisher *rabbitmq.Publisher
}

type RegisterInput struct {
	Email     string
	Password  string
	FirstName string
	LastName  string
	Role      string
}

type AuthTokens struct {
	AccessToken  string
	RefreshToken string
	TokenType    string
}

func (s *AuthService) Register(ctx context.Context, in RegisterInput) (*models.User, error) {
	role := jwt.Role(in.Role)
	if !role.IsValid() {
		return nil, errors.New("invalid role")
	}

	existing, _ := s.Users.GetByEmail(in.Email)
	if existing != nil && existing.ID != 0 {
		return nil, errors.New("user already exists")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Email:      in.Email,
		Password:   string(hash),
		FirstName:  in.FirstName,
		LastName:   in.LastName,
		Role:       role,
		IsActive:   true,
		IsVerified: false,
	}
	if err := s.Users.Create(user); err != nil {
		return nil, err
	}

	if s.Publisher != nil {
		_ = s.Publisher.Publish(ctx, events.UserCreated, events.UserCreatedPayload{
			UserID: user.ID,
			Email:  user.Email,
		})
	}
	return user, nil
}

func (s *AuthService) Login(email, password string) (*AuthTokens, error) {
	user, err := s.Users.GetByEmail(email)
	if err != nil || user.ID == 0 {
		return nil, errors.New("invalid credentials")
	}
	if !user.IsActive {
		return nil, errors.New("user is inactive")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, errors.New("invalid credentials")
	}
	return s.issueTokens(user)
}

func (s *AuthService) Refresh(refreshToken string) (*AuthTokens, error) {
	hash := hashToken(refreshToken)
	stored, err := s.Tokens.GetByHash(hash)
	if err != nil || stored.RevokedAt != nil || stored.ExpiresAt.Before(time.Now()) {
		return nil, errors.New("invalid refresh token")
	}
	user, err := s.Users.GetByID(stored.UserID)
	if err != nil || !user.IsActive {
		return nil, errors.New("invalid refresh token")
	}
	_ = s.Tokens.RevokeByHash(hash)
	return s.issueTokens(user)
}

func (s *AuthService) Logout(refreshToken string) error {
	if refreshToken == "" {
		return nil
	}
	return s.Tokens.RevokeByHash(hashToken(refreshToken))
}

func (s *AuthService) LogoutAll(userID uint) error {
	return s.Tokens.RevokeByUserID(userID)
}

func (s *AuthService) issueTokens(user *models.User) (*AuthTokens, error) {
	access, err := jwt.SignAccessToken(user.ID, user.Role, s.JWTSecret, accessTokenTTL)
	if err != nil {
		return nil, err
	}

	rawRefresh := uuid.NewString()
	hash := hashToken(rawRefresh)
	if err := s.Tokens.Create(&models.RefreshToken{
		UserID:    user.ID,
		TokenHash: hash,
		ExpiresAt: time.Now().Add(refreshTokenTTL),
	}); err != nil {
		return nil, err
	}

	return &AuthTokens{
		AccessToken:  access,
		RefreshToken: rawRefresh,
		TokenType:    "bearer",
	}, nil
}

func (s *AuthService) UpdateProfile(userID uint, firstName, lastName, email *string) (*models.User, error) {
	user, err := s.Users.GetByID(userID)
	if err != nil {
		return nil, err
	}
	if firstName != nil {
		user.FirstName = *firstName
	}
	if lastName != nil {
		user.LastName = *lastName
	}
	if email != nil && *email != user.Email {
		other, _ := s.Users.GetByEmail(*email)
		if other != nil && other.ID != 0 && other.ID != userID {
			return nil, errors.New("email already in use")
		}
		user.Email = *email
	}
	if err := s.Users.Save(user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *AuthService) ChangePassword(userID uint, current, newPassword string) error {
	user, err := s.Users.GetByID(userID)
	if err != nil {
		return err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(current)); err != nil {
		return errors.New("invalid current password")
	}
	if len(newPassword) < 6 {
		return errors.New("password too short")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.Password = string(hash)
	if err := s.Users.Save(user); err != nil {
		return err
	}
	return s.Tokens.RevokeByUserID(userID)
}

func (s *AuthService) SoftDelete(ctx context.Context, userID uint) error {
	user, err := s.Users.GetByID(userID)
	if err != nil {
		return err
	}
	user.IsActive = false
	if err := s.Users.Save(user); err != nil {
		return err
	}
	_ = s.Tokens.RevokeByUserID(userID)
	if s.Publisher != nil {
		_ = s.Publisher.Publish(ctx, events.UserDeleted, events.UserDeletedPayload{UserID: userID})
	}
	return nil
}

func (s *AuthService) ValidateUsers(ids []uint) (bool, []uint, error) {
	found, err := s.Users.FindActiveByIDs(ids)
	if err != nil {
		return false, nil, err
	}
	foundSet := make(map[uint]struct{}, len(found))
	for _, id := range found {
		foundSet[id] = struct{}{}
	}
	var invalid []uint
	for _, id := range ids {
		if _, ok := foundSet[id]; !ok {
			invalid = append(invalid, id)
		}
	}
	return len(invalid) == 0, invalid, nil
}

func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func IsNotFound(err error) bool {
	return errors.Is(err, gorm.ErrRecordNotFound)
}
