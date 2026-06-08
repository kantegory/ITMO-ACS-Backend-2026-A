package main

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"recipe-lab3/internal/common"
)

type store struct {
	mu          sync.RWMutex
	users       map[int]common.User
	userByEmail map[string]int
	tokens      map[string]int
	nextID      int
}

func main() {
	s := &store{
		users:       make(map[int]common.User),
		userByEmail: make(map[string]int),
		tokens:      make(map[string]int),
	}
	_, _ = s.register("alina", "alina@example.com", "password123")

	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/auth/register", s.registerHandler)
	mux.HandleFunc("/api/v1/auth/login", s.loginHandler)
	mux.HandleFunc("/api/v1/users/me", s.meHandler)
	mux.HandleFunc("/internal/auth/validate", s.validateHandler)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		common.JSON(w, http.StatusOK, map[string]string{"service": "auth-service", "status": "ok"})
	})

	log.Println("auth-service listening on :8081")
	log.Fatal(http.ListenAndServe(":8081", mux))
}

func (s *store) registerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		common.Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "method not allowed")
		return
	}
	var req common.RegisterRequest
	if err := common.Decode(r, &req); err != nil {
		common.Error(w, http.StatusBadRequest, "BAD_REQUEST", "invalid JSON body")
		return
	}
	if len(strings.TrimSpace(req.Username)) < 3 || !looksLikeEmail(req.Email) || len(req.Password) < 8 {
		common.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid registration data")
		return
	}
	user, err := s.register(req.Username, req.Email, req.Password)
	if err != nil {
		common.Error(w, http.StatusConflict, "CONFLICT", "email already exists")
		return
	}
	token := s.newToken(user.ID)
	common.JSON(w, http.StatusCreated, common.AuthResponse{AccessToken: token, TokenType: "Bearer", User: user})
}

func (s *store) loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		common.Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "method not allowed")
		return
	}
	var req common.LoginRequest
	if err := common.Decode(r, &req); err != nil {
		common.Error(w, http.StatusBadRequest, "BAD_REQUEST", "invalid JSON body")
		return
	}
	s.mu.RLock()
	userID, exists := s.userByEmail[strings.ToLower(strings.TrimSpace(req.Email))]
	user := s.users[userID]
	s.mu.RUnlock()
	if !exists || user.PasswordHash != hash(req.Password) {
		common.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid email or password")
		return
	}
	token := s.newToken(user.ID)
	common.JSON(w, http.StatusOK, common.AuthResponse{AccessToken: token, TokenType: "Bearer", User: user})
}

func (s *store) meHandler(w http.ResponseWriter, r *http.Request) {
	user, ok := s.userByBearer(w, r)
	if !ok {
		return
	}
	if r.Method == http.MethodGet {
		common.JSON(w, http.StatusOK, user)
		return
	}
	if r.Method != http.MethodPatch {
		common.Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "method not allowed")
		return
	}
	var req common.UpdateUserRequest
	if err := common.Decode(r, &req); err != nil {
		common.Error(w, http.StatusBadRequest, "BAD_REQUEST", "invalid JSON body")
		return
	}
	s.mu.Lock()
	if req.Username != nil {
		user.Username = strings.TrimSpace(*req.Username)
	}
	if req.Bio != nil {
		bio := strings.TrimSpace(*req.Bio)
		user.Bio = &bio
	}
	s.users[user.ID] = user
	s.mu.Unlock()
	common.JSON(w, http.StatusOK, user)
}

func (s *store) validateHandler(w http.ResponseWriter, r *http.Request) {
	user, ok := s.userByBearer(w, r)
	if !ok {
		return
	}
	w.Header().Set("X-User-ID", strconv.Itoa(user.ID))
	common.JSON(w, http.StatusOK, user)
}

func (s *store) register(username, email, password string) (common.User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	email = strings.ToLower(strings.TrimSpace(email))
	if _, exists := s.userByEmail[email]; exists {
		return common.User{}, http.ErrUseLastResponse
	}
	s.nextID++
	user := common.User{
		ID:           s.nextID,
		Username:     strings.TrimSpace(username),
		Email:        email,
		PasswordHash: hash(password),
		CreatedAt:    time.Now().UTC(),
	}
	s.users[user.ID] = user
	s.userByEmail[user.Email] = user.ID
	return user, nil
}

func (s *store) userByBearer(w http.ResponseWriter, r *http.Request) (common.User, bool) {
	token, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
	if !ok || strings.TrimSpace(token) == "" {
		common.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "bearer token required")
		return common.User{}, false
	}
	s.mu.RLock()
	userID, exists := s.tokens[strings.TrimSpace(token)]
	user := s.users[userID]
	s.mu.RUnlock()
	if !exists {
		common.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid token")
		return common.User{}, false
	}
	return user, true
}

func (s *store) newToken(userID int) string {
	data := make([]byte, 24)
	_, _ = rand.Read(data)
	token := hex.EncodeToString(data)
	s.mu.Lock()
	s.tokens[token] = userID
	s.mu.Unlock()
	return token
}

func hash(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

func looksLikeEmail(value string) bool {
	at := strings.Index(value, "@")
	dot := strings.LastIndex(value, ".")
	return at > 0 && dot > at+1 && dot < len(value)-1
}
