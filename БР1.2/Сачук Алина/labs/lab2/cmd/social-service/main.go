package main

import (
	"log"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"recipe-lab2/internal/common"
)

type store struct {
	mu            sync.RWMutex
	comments      map[int]common.Comment
	likes         map[int]map[int]bool
	saved         map[int]map[int]bool
	follows       map[int]map[int]bool
	nextCommentID int
	mq            *common.RabbitMQ
}

func main() {
	s := &store{
		comments: make(map[int]common.Comment),
		likes:    make(map[int]map[int]bool),
		saved:    make(map[int]map[int]bool),
		follows:  make(map[int]map[int]bool),
		mq:       common.NewRabbitMQFromEnv(),
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/recipes/", s.recipeSocialHandler)
	mux.HandleFunc("/api/v1/comments/", s.commentHandler)
	mux.HandleFunc("/api/v1/users/me/saved-recipes", s.savedRecipesHandler)
	mux.HandleFunc("/api/v1/users/", s.userSocialHandler)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		common.JSON(w, http.StatusOK, map[string]string{"service": "social-service", "status": "ok"})
	})

	log.Println("social-service listening on :8083")
	log.Fatal(http.ListenAndServe(":8083", mux))
}

func (s *store) recipeSocialHandler(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/recipes/"), "/"), "/")
	if len(parts) != 2 {
		common.Error(w, http.StatusNotFound, "NOT_FOUND", "route not found")
		return
	}
	recipeID, ok := parseID(w, parts[0])
	if !ok {
		return
	}
	switch parts[1] {
	case "comments":
		if r.Method == http.MethodGet {
			s.listComments(w, r, recipeID)
			return
		}
		if r.Method == http.MethodPost {
			s.createComment(w, r, recipeID)
			return
		}
	case "like":
		if r.Method == http.MethodPost {
			s.setRecipeFlag(w, r, s.likes, recipeID, common.EventRecipeLiked)
			return
		}
		if r.Method == http.MethodDelete {
			s.deleteRecipeFlag(w, r, s.likes, recipeID, common.EventRecipeUnliked)
			return
		}
	case "save":
		if r.Method == http.MethodPost {
			s.setRecipeFlag(w, r, s.saved, recipeID, common.EventRecipeSaved)
			return
		}
		if r.Method == http.MethodDelete {
			s.deleteRecipeFlag(w, r, s.saved, recipeID, common.EventRecipeUnsaved)
			return
		}
	}
	common.Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "method not allowed")
}

func (s *store) commentHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		common.Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "method not allowed")
		return
	}
	commentID, ok := parseID(w, strings.TrimPrefix(r.URL.Path, "/api/v1/comments/"))
	if !ok {
		return
	}
	userID, ok := requireUserID(w, r)
	if !ok {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	comment, exists := s.comments[commentID]
	if !exists {
		common.Error(w, http.StatusNotFound, "NOT_FOUND", "comment not found")
		return
	}
	if comment.UserID != userID {
		common.Error(w, http.StatusForbidden, "FORBIDDEN", "access denied")
		return
	}
	delete(s.comments, commentID)
	go s.publish(common.EventCommentDeleted, comment.RecipeID, userID, -1)
	common.Empty(w, http.StatusNoContent)
}

func (s *store) listComments(w http.ResponseWriter, r *http.Request, recipeID int) {
	page := intQuery(r.URL.Query().Get("page"), 1)
	pageSize := intQuery(r.URL.Query().Get("page_size"), 20)
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	s.mu.RLock()
	items := make([]common.Comment, 0)
	for _, comment := range s.comments {
		if comment.RecipeID == recipeID {
			items = append(items, comment)
		}
	}
	s.mu.RUnlock()
	sort.Slice(items, func(i, j int) bool { return items[i].CreatedAt.Before(items[j].CreatedAt) })
	total := len(items)
	start := (page - 1) * pageSize
	if start > total {
		start = total
	}
	end := start + pageSize
	if end > total {
		end = total
	}
	common.JSON(w, http.StatusOK, common.CommentListResponse{Items: items[start:end], Page: page, PageSize: pageSize, Total: total})
}

func (s *store) createComment(w http.ResponseWriter, r *http.Request, recipeID int) {
	userID, ok := requireUserID(w, r)
	if !ok {
		return
	}
	var req common.CreateCommentRequest
	if err := common.Decode(r, &req); err != nil || strings.TrimSpace(req.Text) == "" {
		common.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid comment data")
		return
	}
	s.mu.Lock()
	s.nextCommentID++
	comment := common.Comment{ID: s.nextCommentID, UserID: userID, RecipeID: recipeID, Text: strings.TrimSpace(req.Text), CreatedAt: time.Now().UTC()}
	s.comments[comment.ID] = comment
	s.mu.Unlock()
	go s.publish(common.EventCommentCreated, recipeID, userID, 1)
	common.JSON(w, http.StatusCreated, comment)
}

func (s *store) setRecipeFlag(w http.ResponseWriter, r *http.Request, bucket map[int]map[int]bool, recipeID int, eventType string) {
	userID, ok := requireUserID(w, r)
	if !ok {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if bucket[userID] == nil {
		bucket[userID] = make(map[int]bool)
	}
	if bucket[userID][recipeID] {
		common.Error(w, http.StatusConflict, "CONFLICT", "relation already exists")
		return
	}
	bucket[userID][recipeID] = true
	go s.publish(eventType, recipeID, userID, 1)
	common.Empty(w, http.StatusCreated)
}

func (s *store) deleteRecipeFlag(w http.ResponseWriter, r *http.Request, bucket map[int]map[int]bool, recipeID int, eventType string) {
	userID, ok := requireUserID(w, r)
	if !ok {
		return
	}
	s.mu.Lock()
	removed := false
	if bucket[userID] != nil && bucket[userID][recipeID] {
		delete(bucket[userID], recipeID)
		removed = true
	}
	s.mu.Unlock()
	if removed {
		go s.publish(eventType, recipeID, userID, -1)
	}
	common.Empty(w, http.StatusNoContent)
}

func (s *store) publish(eventType string, recipeID int, userID int, delta int) {
	event := common.RecipeEvent{
		Type:      eventType,
		RecipeID:  recipeID,
		UserID:    userID,
		Delta:     delta,
		CreatedAt: time.Now().UTC(),
	}
	if err := s.mq.PublishEvent(event); err != nil {
		log.Printf("rabbitmq publish skipped: %v", err)
	}
}

func (s *store) savedRecipesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		common.Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "method not allowed")
		return
	}
	userID, ok := requireUserID(w, r)
	if !ok {
		return
	}
	s.mu.RLock()
	items := make([]common.RecipeCard, 0)
	for recipeID := range s.saved[userID] {
		items = append(items, common.RecipeCard{ID: recipeID, UserID: userID, Title: "saved recipe", DishType: "unknown", Difficulty: "easy", CreatedAt: time.Now().UTC()})
	}
	s.mu.RUnlock()
	common.JSON(w, http.StatusOK, common.RecipeListResponse{Items: items, Page: 1, PageSize: 20, Total: len(items)})
}

func (s *store) userSocialHandler(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/users/"), "/"), "/")
	if len(parts) != 2 {
		common.Error(w, http.StatusNotFound, "NOT_FOUND", "route not found")
		return
	}
	targetID, ok := parseID(w, parts[0])
	if !ok {
		return
	}
	if parts[1] == "follow" {
		if r.Method == http.MethodPost {
			s.follow(w, r, targetID)
			return
		}
		if r.Method == http.MethodDelete {
			s.unfollow(w, r, targetID)
			return
		}
	}
	if parts[1] == "followers" && r.Method == http.MethodGet {
		s.followers(w, targetID)
		return
	}
	if parts[1] == "following" && r.Method == http.MethodGet {
		s.following(w, targetID)
		return
	}
	common.Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "method not allowed")
}

func (s *store) follow(w http.ResponseWriter, r *http.Request, targetID int) {
	userID, ok := requireUserID(w, r)
	if !ok {
		return
	}
	if userID == targetID {
		common.Error(w, http.StatusConflict, "CONFLICT", "cannot follow yourself")
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.follows[userID] == nil {
		s.follows[userID] = make(map[int]bool)
	}
	if s.follows[userID][targetID] {
		common.Error(w, http.StatusConflict, "CONFLICT", "already following")
		return
	}
	s.follows[userID][targetID] = true
	common.Empty(w, http.StatusCreated)
}

func (s *store) unfollow(w http.ResponseWriter, r *http.Request, targetID int) {
	userID, ok := requireUserID(w, r)
	if !ok {
		return
	}
	s.mu.Lock()
	if s.follows[userID] != nil {
		delete(s.follows[userID], targetID)
	}
	s.mu.Unlock()
	common.Empty(w, http.StatusNoContent)
}

func (s *store) followers(w http.ResponseWriter, userID int) {
	s.mu.RLock()
	items := make([]common.User, 0)
	for followerID, targets := range s.follows {
		if targets[userID] {
			items = append(items, common.User{ID: followerID, Username: "user_" + strconv.Itoa(followerID), CreatedAt: time.Now().UTC()})
		}
	}
	s.mu.RUnlock()
	common.JSON(w, http.StatusOK, common.UserListResponse{Items: items, Total: len(items)})
}

func (s *store) following(w http.ResponseWriter, userID int) {
	s.mu.RLock()
	items := make([]common.User, 0)
	for targetID := range s.follows[userID] {
		items = append(items, common.User{ID: targetID, Username: "user_" + strconv.Itoa(targetID), CreatedAt: time.Now().UTC()})
	}
	s.mu.RUnlock()
	common.JSON(w, http.StatusOK, common.UserListResponse{Items: items, Total: len(items)})
}

func requireUserID(w http.ResponseWriter, r *http.Request) (int, bool) {
	userID, err := strconv.Atoi(r.Header.Get("X-User-ID"))
	if err != nil || userID < 1 {
		common.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "gateway user context required")
		return 0, false
	}
	return userID, true
}

func parseID(w http.ResponseWriter, raw string) (int, bool) {
	id, err := strconv.Atoi(raw)
	if err != nil || id < 1 {
		common.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid id")
		return 0, false
	}
	return id, true
}

func intQuery(raw string, fallback int) int {
	if raw == "" {
		return fallback
	}
	value, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return value
}
