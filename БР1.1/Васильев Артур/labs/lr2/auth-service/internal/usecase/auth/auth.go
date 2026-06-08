package auth

import (
	"context"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"auth-service/internal/domain"
	"auth-service/pkg/apperror"
	"auth-service/pkg/slogutil"
)

const component = "auth"

type UseCase struct {
	users    UserRepository
	profiles ProfileClient
	events   EventPublisher
	tokens   TokenProvider
}

func NewUseCase(users UserRepository, profiles ProfileClient, events EventPublisher, tokens TokenProvider) *UseCase {
	return &UseCase{users: users, profiles: profiles, events: events, tokens: tokens}
}

type AuthResult struct {
	Token string
	User  domain.User
}

func (uc *UseCase) RegisterCandidate(ctx context.Context, email, password, fullName string) (*AuthResult, error) {
	if err := validateCredentials(email, password); err != nil {
		return nil, err
	}
	if strings.TrimSpace(fullName) == "" {
		return nil, apperror.Validation("full_name is required")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, apperror.Internal(err)
	}

	user, err := uc.users.Create(ctx, strings.ToLower(strings.TrimSpace(email)), string(hash), domain.RoleCandidate)
	if err != nil {
		return nil, err
	}

	if err := uc.profiles.CreateProfile(ctx, user.ID, domain.RoleCandidate, fullName, ""); err != nil {
		_ = uc.users.DeleteByID(ctx, user.ID)
		return nil, err
	}
	if err := uc.events.UserCreated(ctx, user.ID, user.Email, user.Role); err != nil {
		slogutil.LogError(ctx, slogutil.LayerUsecase, component, "kafka publish failed", err)
	}

	return uc.buildAuthResult(ctx, user)
}

func (uc *UseCase) RegisterEmployer(ctx context.Context, email, password, companyName string) (*AuthResult, error) {
	if err := validateCredentials(email, password); err != nil {
		return nil, err
	}
	if strings.TrimSpace(companyName) == "" {
		return nil, apperror.Validation("company_name is required")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, apperror.Internal(err)
	}

	user, err := uc.users.Create(ctx, strings.ToLower(strings.TrimSpace(email)), string(hash), domain.RoleEmployer)
	if err != nil {
		return nil, err
	}

	if err := uc.profiles.CreateProfile(ctx, user.ID, domain.RoleEmployer, "", companyName); err != nil {
		_ = uc.users.DeleteByID(ctx, user.ID)
		return nil, err
	}
	if err := uc.events.UserCreated(ctx, user.ID, user.Email, user.Role); err != nil {
		slogutil.LogError(ctx, slogutil.LayerUsecase, component, "kafka publish failed", err)
	}

	return uc.buildAuthResult(ctx, user)
}

func (uc *UseCase) Login(ctx context.Context, email, password string) (*AuthResult, error) {
	if email == "" || password == "" {
		return nil, apperror.Validation("email and password are required")
	}

	user, err := uc.users.GetByEmail(ctx, strings.ToLower(strings.TrimSpace(email)))
	if err != nil {
		return nil, apperror.Unauthorized("invalid email or password")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, apperror.Unauthorized("invalid email or password")
	}

	return uc.buildAuthResult(ctx, user)
}

func (uc *UseCase) GetUser(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	user, err := uc.users.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	user.PasswordHash = ""
	return user, nil
}

func (uc *UseCase) buildAuthResult(ctx context.Context, user *domain.User) (*AuthResult, error) {
	token, err := uc.tokens.Generate(user.ID, user.Role)
	if err != nil {
		return nil, apperror.Internal(err)
	}
	u := *user
	u.PasswordHash = ""
	return &AuthResult{Token: token, User: u}, nil
}

func validateCredentials(email, password string) error {
	if strings.TrimSpace(email) == "" {
		return apperror.Validation("email is required")
	}
	if len(password) < 8 {
		return apperror.Validation("password must be at least 8 characters")
	}
	return nil
}

type JWTProvider struct {
	secret []byte
	ttl    time.Duration
}

func NewJWTProvider(secret string, ttl time.Duration) *JWTProvider {
	return &JWTProvider{secret: []byte(secret), ttl: ttl}
}

type claims struct {
	UserID uuid.UUID   `json:"uid"`
	Role   domain.Role `json:"role"`
	jwt.RegisteredClaims
}

func (p *JWTProvider) Generate(userID uuid.UUID, role domain.Role) (string, error) {
	c := claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(p.ttl)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, c).SignedString(p.secret)
}

func (p *JWTProvider) Parse(tokenStr string) (uuid.UUID, domain.Role, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &claims{}, func(t *jwt.Token) (any, error) {
		return p.secret, nil
	})
	if err != nil || !token.Valid {
		return uuid.Nil, "", apperror.Unauthorized("invalid token")
	}
	c, ok := token.Claims.(*claims)
	if !ok {
		return uuid.Nil, "", apperror.Unauthorized("invalid token")
	}
	return c.UserID, c.Role, nil
}
