package auth

import (
	"context"
	"log/slog"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"jobsearch/internal/domain"
	"jobsearch/pkg/apperror"
	"jobsearch/pkg/slogutil"
)

const component = "auth"

type UseCase struct {
	users      UserRepository
	candidates CandidateRepository
	employers  EmployerRepository
	tokens     TokenProvider
}

func NewUseCase(users UserRepository, candidates CandidateRepository, employers EmployerRepository, tokens TokenProvider) *UseCase {
	return &UseCase{users: users, candidates: candidates, employers: employers, tokens: tokens}
}

type AuthResult struct {
	Token string
	User  domain.User
}

func (uc *UseCase) RegisterCandidate(ctx context.Context, email, password, fullName string) (*AuthResult, error) {
	slogutil.LogInfo(ctx, slogutil.LayerUsecase, component, "register candidate usecase started",
		slog.String("email", email),
	)

	if err := validateCredentials(email, password); err != nil {
		slogutil.LogError(ctx, slogutil.LayerUsecase, component, "validation failed", err)
		return nil, err
	}
	if strings.TrimSpace(fullName) == "" {
		err := apperror.Validation("full_name is required")
		slogutil.LogError(ctx, slogutil.LayerUsecase, component, "validation failed", err)
		return nil, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		slogutil.LogError(ctx, slogutil.LayerUsecase, component, "password hash failed", err)
		return nil, apperror.Internal(err)
	}

	user, err := uc.users.Create(ctx, strings.ToLower(strings.TrimSpace(email)), string(hash), domain.RoleCandidate)
	if err != nil {
		slogutil.LogError(ctx, slogutil.LayerUsecase, component, "user create failed", err)
		return nil, err
	}
	slogutil.LogInfo(ctx, slogutil.LayerUsecase, component, "user created",
		slog.String("user_id", user.ID.String()),
	)

	if _, err := uc.candidates.Create(ctx, user.ID, fullName); err != nil {
		slogutil.LogError(ctx, slogutil.LayerUsecase, component, "candidate profile create failed", err,
			slog.String("user_id", user.ID.String()),
		)
		if delErr := uc.users.DeleteByID(ctx, user.ID); delErr != nil {
			slogutil.LogError(ctx, slogutil.LayerUsecase, component, "rollback user after candidate failure", delErr)
		}
		return nil, err
	}
	slogutil.LogInfo(ctx, slogutil.LayerUsecase, component, "candidate profile created",
		slog.String("user_id", user.ID.String()),
	)

	return uc.buildAuthResult(ctx, user)
}

func (uc *UseCase) RegisterEmployer(ctx context.Context, email, password, companyName string) (*AuthResult, error) {
	slogutil.LogInfo(ctx, slogutil.LayerUsecase, component, "register employer usecase started",
		slog.String("email", email),
	)

	if err := validateCredentials(email, password); err != nil {
		slogutil.LogError(ctx, slogutil.LayerUsecase, component, "validation failed", err)
		return nil, err
	}
	if strings.TrimSpace(companyName) == "" {
		err := apperror.Validation("company_name is required")
		slogutil.LogError(ctx, slogutil.LayerUsecase, component, "validation failed", err)
		return nil, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		slogutil.LogError(ctx, slogutil.LayerUsecase, component, "password hash failed", err)
		return nil, apperror.Internal(err)
	}

	user, err := uc.users.Create(ctx, strings.ToLower(strings.TrimSpace(email)), string(hash), domain.RoleEmployer)
	if err != nil {
		slogutil.LogError(ctx, slogutil.LayerUsecase, component, "user create failed", err)
		return nil, err
	}

	if _, err := uc.employers.Create(ctx, user.ID, companyName); err != nil {
		slogutil.LogError(ctx, slogutil.LayerUsecase, component, "employer profile create failed", err,
			slog.String("user_id", user.ID.String()),
		)
		if delErr := uc.users.DeleteByID(ctx, user.ID); delErr != nil {
			slogutil.LogError(ctx, slogutil.LayerUsecase, component, "rollback user after employer failure", delErr)
		}
		return nil, err
	}

	return uc.buildAuthResult(ctx, user)
}

func (uc *UseCase) Login(ctx context.Context, email, password string) (*AuthResult, error) {
	slogutil.LogInfo(ctx, slogutil.LayerUsecase, component, "login usecase started",
		slog.String("email", email),
	)

	if email == "" || password == "" {
		err := apperror.Validation("email and password are required")
		slogutil.LogError(ctx, slogutil.LayerUsecase, component, "validation failed", err)
		return nil, err
	}

	user, err := uc.users.GetByEmail(ctx, strings.ToLower(strings.TrimSpace(email)))
	if err != nil {
		slogutil.LogError(ctx, slogutil.LayerUsecase, component, "user not found or db error", err)
		return nil, apperror.Unauthorized("invalid email or password")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		slogutil.LogError(ctx, slogutil.LayerUsecase, component, "password mismatch", err)
		return nil, apperror.Unauthorized("invalid email or password")
	}

	return uc.buildAuthResult(ctx, user)
}

func (uc *UseCase) buildAuthResult(ctx context.Context, user *domain.User) (*AuthResult, error) {
	token, err := uc.tokens.Generate(user.ID, user.Role)
	if err != nil {
		slogutil.LogError(ctx, slogutil.LayerUsecase, component, "jwt generate failed", err)
		return nil, apperror.Internal(err)
	}
	u := *user
	u.PasswordHash = ""
	slogutil.LogInfo(ctx, slogutil.LayerUsecase, component, "auth result built",
		slog.String("user_id", u.ID.String()),
		slog.String("role", string(u.Role)),
	)
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

// JWTProvider implements TokenProvider.
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
