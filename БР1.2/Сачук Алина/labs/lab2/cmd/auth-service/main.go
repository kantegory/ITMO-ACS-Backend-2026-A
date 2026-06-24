package main

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	"recipe-lab2/internal/common"
)

var errEmailExists = errors.New("email already exists")

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

	router := common.NewRouter()
	router.POST("/api/v1/auth/register", s.registerHandler)
	router.POST("/api/v1/auth/login", s.loginHandler)
	router.GET("/api/v1/users/me", s.getMeHandler)
	router.PATCH("/api/v1/users/me", s.updateMeHandler)
	router.GET("/internal/auth/validate", s.validateHandler)
	router.GET("/health", common.Health("auth-service"))

	log.Println("auth-service listening on :8081")
	log.Fatal(router.Run(":8081"))
}

func (s *store) registerHandler(c *gin.Context) {
	var req common.RegisterRequest
	if err := common.Decode(c, &req); err != nil {
		common.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid JSON body")
		return
	}
	if len(strings.TrimSpace(req.Username)) < 3 || !looksLikeEmail(req.Email) || len(req.Password) < 8 {
		common.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid registration data")
		return
	}
	user, err := s.register(req.Username, req.Email, req.Password)
	if err != nil {
		common.Error(c, http.StatusConflict, "CONFLICT", "email already exists")
		return
	}
	token := s.newToken(user.ID)
	common.JSON(c, http.StatusCreated, common.AuthResponse{AccessToken: token, TokenType: "Bearer", User: user})
}

func (s *store) loginHandler(c *gin.Context) {
	var req common.LoginRequest
	if err := common.Decode(c, &req); err != nil {
		common.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid JSON body")
		return
	}
	s.mu.RLock()
	userID, exists := s.userByEmail[strings.ToLower(strings.TrimSpace(req.Email))]
	user := s.users[userID]
	s.mu.RUnlock()
	if !exists || user.PasswordHash != hash(req.Password) {
		common.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "invalid email or password")
		return
	}
	token := s.newToken(user.ID)
	common.JSON(c, http.StatusOK, common.AuthResponse{AccessToken: token, TokenType: "Bearer", User: user})
}

func (s *store) getMeHandler(c *gin.Context) {
	user, ok := s.userByBearer(c)
	if ok {
		common.JSON(c, http.StatusOK, user)
	}
}

func (s *store) updateMeHandler(c *gin.Context) {
	user, ok := s.userByBearer(c)
	if !ok {
		return
	}
	var req common.UpdateUserRequest
	if err := common.Decode(c, &req); err != nil {
		common.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid JSON body")
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
	common.JSON(c, http.StatusOK, user)
}

func (s *store) validateHandler(c *gin.Context) {
	user, ok := s.userByBearer(c)
	if !ok {
		return
	}
	c.Header("X-User-ID", strconv.Itoa(user.ID))
	common.JSON(c, http.StatusOK, user)
}

func (s *store) register(username, email, password string) (common.User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	email = strings.ToLower(strings.TrimSpace(email))
	if _, exists := s.userByEmail[email]; exists {
		return common.User{}, errEmailExists
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

func (s *store) userByBearer(c *gin.Context) (common.User, bool) {
	token, ok := strings.CutPrefix(c.GetHeader("Authorization"), "Bearer ")
	if !ok || strings.TrimSpace(token) == "" {
		common.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "bearer token required")
		return common.User{}, false
	}
	s.mu.RLock()
	userID, exists := s.tokens[strings.TrimSpace(token)]
	user := s.users[userID]
	s.mu.RUnlock()
	if !exists {
		common.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "invalid token")
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
