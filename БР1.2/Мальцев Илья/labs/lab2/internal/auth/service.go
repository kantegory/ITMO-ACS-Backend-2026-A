package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"strings"
	"sync"

	"job-search-microservices/internal/models"
	"job-search-microservices/internal/platform"
)

type Service struct {
	mu           sync.RWMutex
	users        map[string]userRecord
	usersByEmail map[string]string
	tokens       map[string]string
}

type userRecord struct {
	User         models.User
	PasswordHash string
}

type registerRequest struct {
	Email       string          `json:"email"`
	Password    string          `json:"password"`
	Role        models.UserRole `json:"role"`
	FirstName   string          `json:"first_name"`
	LastName    string          `json:"last_name"`
	CompanyName string          `json:"company_name"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func New() *Service {
	service := &Service{
		users:        make(map[string]userRecord),
		usersByEmail: make(map[string]string),
		tokens:       make(map[string]string),
	}
	service.seed()
	return service
}

func (service *Service) Handler() http.Handler {
	return service
}

func (service *Service) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	platform.CORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	path := strings.TrimRight(r.URL.Path, "/")
	switch path {
	case "/auth/register":
		if platform.RequireMethod(w, r, http.MethodPost) {
			service.register(w, r)
		}
	case "/auth/login":
		if platform.RequireMethod(w, r, http.MethodPost) {
			service.login(w, r)
		}
	case "/auth/me", "/internal/auth/user":
		if platform.RequireMethod(w, r, http.MethodGet) {
			service.me(w, r)
		}
	case "/health":
		if platform.RequireMethod(w, r, http.MethodGet) {
			platform.WriteJSON(w, http.StatusOK, map[string]string{"service": "auth", "status": "ok"})
		}
	default:
		platform.WriteError(w, platform.NotFound("route not found"))
	}
}

func (service *Service) register(w http.ResponseWriter, r *http.Request) {
	var request registerRequest
	if err := platform.DecodeJSON(r, &request); err != nil {
		platform.WriteError(w, err)
		return
	}

	user, token, err := service.createUser(request)
	if err != nil {
		platform.WriteError(w, err)
		return
	}

	platform.WriteJSON(w, http.StatusCreated, models.AuthResponse{AccessToken: token, User: user})
}

func (service *Service) login(w http.ResponseWriter, r *http.Request) {
	var request loginRequest
	if err := platform.DecodeJSON(r, &request); err != nil {
		platform.WriteError(w, err)
		return
	}

	service.mu.Lock()
	defer service.mu.Unlock()

	email := normalizeEmail(request.Email)
	userID, ok := service.usersByEmail[email]
	if !ok {
		platform.WriteError(w, platform.Unauthorized("invalid email or password"))
		return
	}

	record := service.users[userID]
	if record.PasswordHash != hashPassword(request.Password) {
		platform.WriteError(w, platform.Unauthorized("invalid email or password"))
		return
	}

	token := service.issueTokenLocked(record.User.ID)
	platform.WriteJSON(w, http.StatusOK, models.AuthResponse{AccessToken: token, User: record.User})
}

func (service *Service) me(w http.ResponseWriter, r *http.Request) {
	token, err := platform.BearerToken(r)
	if err != nil {
		platform.WriteError(w, err)
		return
	}

	user, err := service.userByToken(token)
	if err != nil {
		platform.WriteError(w, err)
		return
	}

	platform.WriteJSON(w, http.StatusOK, user)
}

func (service *Service) createUser(request registerRequest) (models.User, string, error) {
	service.mu.Lock()
	defer service.mu.Unlock()

	email := normalizeEmail(request.Email)
	if email == "" || !strings.Contains(email, "@") {
		return models.User{}, "", platform.BadRequest("valid email is required")
	}
	if len(request.Password) < 8 {
		return models.User{}, "", platform.BadRequest("password must contain at least 8 characters")
	}
	if !request.Role.Valid() {
		return models.User{}, "", platform.BadRequest("role must be applicant or employer")
	}
	if _, exists := service.usersByEmail[email]; exists {
		return models.User{}, "", platform.Conflict("user with this email already exists")
	}

	user := models.User{
		ID:        platform.NewID(),
		Email:     email,
		Role:      request.Role,
		FirstName: strings.TrimSpace(request.FirstName),
		LastName:  strings.TrimSpace(request.LastName),
	}
	if request.Role == models.RoleEmployer {
		user.CompanyID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd"
	}

	service.users[user.ID] = userRecord{User: user, PasswordHash: hashPassword(request.Password)}
	service.usersByEmail[user.Email] = user.ID

	token := service.issueTokenLocked(user.ID)
	return user, token, nil
}

func (service *Service) userByToken(token string) (models.User, error) {
	service.mu.RLock()
	defer service.mu.RUnlock()

	userID, ok := service.tokens[token]
	if !ok {
		return models.User{}, platform.Unauthorized("invalid or expired access token")
	}

	record, ok := service.users[userID]
	if !ok {
		return models.User{}, platform.Unauthorized("invalid or expired access token")
	}

	return record.User, nil
}

func (service *Service) issueTokenLocked(userID string) string {
	token := platform.NewID() + "." + platform.NewID()
	service.tokens[token] = userID
	return token
}

func (service *Service) seed() {
	applicant := models.User{
		ID:        "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
		Email:     "applicant@example.com",
		Role:      models.RoleApplicant,
		FirstName: "Ilya",
		LastName:  "Maltsev",
	}
	employer := models.User{
		ID:        "ffffffff-ffff-4fff-8fff-ffffffffffff",
		Email:     "employer@example.com",
		Role:      models.RoleEmployer,
		CompanyID: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
	}

	service.users[applicant.ID] = userRecord{User: applicant, PasswordHash: hashPassword("password123")}
	service.users[employer.ID] = userRecord{User: employer, PasswordHash: hashPassword("password123")}
	service.usersByEmail[applicant.Email] = applicant.ID
	service.usersByEmail[employer.Email] = employer.ID
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func hashPassword(password string) string {
	hash := sha256.Sum256([]byte("job-search-microservices:" + password))
	return hex.EncodeToString(hash[:])
}
