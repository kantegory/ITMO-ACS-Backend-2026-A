package main

import (
	"log"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	"recipe-lab3/internal/common"
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

	router := common.NewRouter()
	router.GET("/api/v1/recipes/:recipeID/comments", s.listCommentsHandler)
	router.POST("/api/v1/recipes/:recipeID/comments", s.createCommentHandler)
	router.POST("/api/v1/recipes/:recipeID/like", s.likeRecipeHandler)
	router.DELETE("/api/v1/recipes/:recipeID/like", s.unlikeRecipeHandler)
	router.POST("/api/v1/recipes/:recipeID/save", s.saveRecipeHandler)
	router.DELETE("/api/v1/recipes/:recipeID/save", s.unsaveRecipeHandler)
	router.DELETE("/api/v1/comments/:commentID", s.deleteCommentHandler)
	router.GET("/api/v1/users/me/saved-recipes", s.savedRecipesHandler)
	router.POST("/api/v1/users/:userID/follow", s.followHandler)
	router.DELETE("/api/v1/users/:userID/follow", s.unfollowHandler)
	router.GET("/api/v1/users/:userID/followers", s.followersHandler)
	router.GET("/api/v1/users/:userID/following", s.followingHandler)
	router.GET("/health", common.Health("social-service"))

	log.Println("social-service listening on :8083")
	log.Fatal(router.Run(":8083"))
}

func (s *store) listCommentsHandler(c *gin.Context) {
	recipeID, ok := parseID(c, c.Param("recipeID"))
	if !ok {
		return
	}
	s.listComments(c, recipeID)
}

func (s *store) createCommentHandler(c *gin.Context) {
	recipeID, ok := parseID(c, c.Param("recipeID"))
	if !ok {
		return
	}
	s.createComment(c, recipeID)
}

func (s *store) likeRecipeHandler(c *gin.Context) {
	recipeID, ok := parseID(c, c.Param("recipeID"))
	if !ok {
		return
	}
	s.setRecipeFlag(c, s.likes, recipeID, common.EventRecipeLiked)
}

func (s *store) unlikeRecipeHandler(c *gin.Context) {
	recipeID, ok := parseID(c, c.Param("recipeID"))
	if !ok {
		return
	}
	s.deleteRecipeFlag(c, s.likes, recipeID, common.EventRecipeUnliked)
}

func (s *store) saveRecipeHandler(c *gin.Context) {
	recipeID, ok := parseID(c, c.Param("recipeID"))
	if !ok {
		return
	}
	s.setRecipeFlag(c, s.saved, recipeID, common.EventRecipeSaved)
}

func (s *store) unsaveRecipeHandler(c *gin.Context) {
	recipeID, ok := parseID(c, c.Param("recipeID"))
	if !ok {
		return
	}
	s.deleteRecipeFlag(c, s.saved, recipeID, common.EventRecipeUnsaved)
}

func (s *store) deleteCommentHandler(c *gin.Context) {
	commentID, ok := parseID(c, c.Param("commentID"))
	if !ok {
		return
	}
	userID, ok := requireUserID(c)
	if !ok {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	comment, exists := s.comments[commentID]
	if !exists {
		common.Error(c, http.StatusNotFound, "NOT_FOUND", "comment not found")
		return
	}
	if comment.UserID != userID {
		common.Error(c, http.StatusForbidden, "FORBIDDEN", "access denied")
		return
	}
	delete(s.comments, commentID)
	go s.publish(common.EventCommentDeleted, comment.RecipeID, userID, -1)
	common.Empty(c, http.StatusNoContent)
}

func (s *store) listComments(c *gin.Context, recipeID int) {
	page := intQuery(c.Query("page"), 1)
	pageSize := intQuery(c.Query("page_size"), 20)
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
	common.JSON(c, http.StatusOK, common.CommentListResponse{Items: items[start:end], Page: page, PageSize: pageSize, Total: total})
}

func (s *store) createComment(c *gin.Context, recipeID int) {
	userID, ok := requireUserID(c)
	if !ok {
		return
	}
	var req common.CreateCommentRequest
	if err := common.Decode(c, &req); err != nil || strings.TrimSpace(req.Text) == "" {
		common.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid comment data")
		return
	}
	s.mu.Lock()
	s.nextCommentID++
	comment := common.Comment{ID: s.nextCommentID, UserID: userID, RecipeID: recipeID, Text: strings.TrimSpace(req.Text), CreatedAt: time.Now().UTC()}
	s.comments[comment.ID] = comment
	s.mu.Unlock()
	go s.publish(common.EventCommentCreated, recipeID, userID, 1)
	common.JSON(c, http.StatusCreated, comment)
}

func (s *store) setRecipeFlag(c *gin.Context, bucket map[int]map[int]bool, recipeID int, eventType string) {
	userID, ok := requireUserID(c)
	if !ok {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if bucket[userID] == nil {
		bucket[userID] = make(map[int]bool)
	}
	if bucket[userID][recipeID] {
		common.Error(c, http.StatusConflict, "CONFLICT", "relation already exists")
		return
	}
	bucket[userID][recipeID] = true
	go s.publish(eventType, recipeID, userID, 1)
	common.Empty(c, http.StatusCreated)
}

func (s *store) deleteRecipeFlag(c *gin.Context, bucket map[int]map[int]bool, recipeID int, eventType string) {
	userID, ok := requireUserID(c)
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
	common.Empty(c, http.StatusNoContent)
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

func (s *store) savedRecipesHandler(c *gin.Context) {
	userID, ok := requireUserID(c)
	if !ok {
		return
	}
	s.mu.RLock()
	items := make([]common.RecipeCard, 0)
	for recipeID := range s.saved[userID] {
		items = append(items, common.RecipeCard{ID: recipeID, UserID: userID, Title: "saved recipe", DishType: "unknown", Difficulty: "easy", CreatedAt: time.Now().UTC()})
	}
	s.mu.RUnlock()
	common.JSON(c, http.StatusOK, common.RecipeListResponse{Items: items, Page: 1, PageSize: 20, Total: len(items)})
}

func (s *store) followHandler(c *gin.Context) {
	targetID, ok := parseID(c, c.Param("userID"))
	if !ok {
		return
	}
	s.follow(c, targetID)
}

func (s *store) unfollowHandler(c *gin.Context) {
	targetID, ok := parseID(c, c.Param("userID"))
	if !ok {
		return
	}
	s.unfollow(c, targetID)
}

func (s *store) followersHandler(c *gin.Context) {
	userID, ok := parseID(c, c.Param("userID"))
	if !ok {
		return
	}
	s.followers(c, userID)
}

func (s *store) followingHandler(c *gin.Context) {
	userID, ok := parseID(c, c.Param("userID"))
	if !ok {
		return
	}
	s.following(c, userID)
}

func (s *store) follow(c *gin.Context, targetID int) {
	userID, ok := requireUserID(c)
	if !ok {
		return
	}
	if userID == targetID {
		common.Error(c, http.StatusConflict, "CONFLICT", "cannot follow yourself")
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.follows[userID] == nil {
		s.follows[userID] = make(map[int]bool)
	}
	if s.follows[userID][targetID] {
		common.Error(c, http.StatusConflict, "CONFLICT", "already following")
		return
	}
	s.follows[userID][targetID] = true
	common.Empty(c, http.StatusCreated)
}

func (s *store) unfollow(c *gin.Context, targetID int) {
	userID, ok := requireUserID(c)
	if !ok {
		return
	}
	s.mu.Lock()
	if s.follows[userID] != nil {
		delete(s.follows[userID], targetID)
	}
	s.mu.Unlock()
	common.Empty(c, http.StatusNoContent)
}

func (s *store) followers(c *gin.Context, userID int) {
	s.mu.RLock()
	items := make([]common.User, 0)
	for followerID, targets := range s.follows {
		if targets[userID] {
			items = append(items, common.User{ID: followerID, Username: "user_" + strconv.Itoa(followerID), CreatedAt: time.Now().UTC()})
		}
	}
	s.mu.RUnlock()
	common.JSON(c, http.StatusOK, common.UserListResponse{Items: items, Total: len(items)})
}

func (s *store) following(c *gin.Context, userID int) {
	s.mu.RLock()
	items := make([]common.User, 0)
	for targetID := range s.follows[userID] {
		items = append(items, common.User{ID: targetID, Username: "user_" + strconv.Itoa(targetID), CreatedAt: time.Now().UTC()})
	}
	s.mu.RUnlock()
	common.JSON(c, http.StatusOK, common.UserListResponse{Items: items, Total: len(items)})
}

func requireUserID(c *gin.Context) (int, bool) {
	userID, err := strconv.Atoi(c.GetHeader("X-User-ID"))
	if err != nil || userID < 1 {
		common.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "gateway user context required")
		return 0, false
	}
	return userID, true
}

func parseID(c *gin.Context, raw string) (int, bool) {
	id, err := strconv.Atoi(raw)
	if err != nil || id < 1 {
		common.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid id")
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
