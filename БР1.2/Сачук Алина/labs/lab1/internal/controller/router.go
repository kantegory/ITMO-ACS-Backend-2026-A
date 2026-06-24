package controller

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"recipe-lab1/internal/model"
	"recipe-lab1/internal/store"
	"recipe-lab1/internal/view"
)

type Router struct {
	store *store.MemoryStore
}

func NewRouter(appStore *store.MemoryStore) *gin.Engine {
	rt := &Router{store: appStore}
	router := gin.Default()
	router.HandleMethodNotAllowed = true
	router.Use(cors())
	router.NoMethod(func(c *gin.Context) {
		view.Error(c, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "method not allowed")
	})
	router.NoRoute(func(c *gin.Context) {
		view.Error(c, http.StatusNotFound, "NOT_FOUND", "route not found")
	})

	health := func(c *gin.Context) {
		view.JSON(c, http.StatusOK, map[string]string{"status": "ok"})
	}
	router.GET("/health", health)
	router.GET("/api/v1/health", health)

	api := router.Group("/api/v1")
	api.GET("", func(c *gin.Context) {
		view.JSON(c, http.StatusOK, map[string]string{"service": "Recipe Sharing and Culinary Blogs API"})
	})
	api.POST("/auth/register", rt.register)
	api.POST("/auth/login", rt.login)
	api.GET("/users/me", rt.me)
	api.PATCH("/users/me", rt.updateMe)
	api.GET("/users/me/saved-recipes", rt.savedRecipes)
	api.GET("/users/me/recipes", rt.myRecipes)
	api.POST("/users/:userId/follow", withID("userId", rt.followUser))
	api.DELETE("/users/:userId/follow", withID("userId", rt.unfollowUser))
	api.GET("/users/:userId/followers", withID("userId", rt.followers))
	api.GET("/users/:userId/following", withID("userId", rt.following))
	api.GET("/recipes", func(c *gin.Context) {
		rt.listRecipes(c, store.RecipeFilter{})
	})
	api.POST("/recipes", rt.createRecipe)
	api.GET("/recipes/:recipeId", withID("recipeId", rt.getRecipe))
	api.PUT("/recipes/:recipeId", withID("recipeId", rt.updateRecipe))
	api.DELETE("/recipes/:recipeId", withID("recipeId", rt.deleteRecipe))
	api.GET("/recipes/:recipeId/comments", withID("recipeId", rt.listComments))
	api.POST("/recipes/:recipeId/comments", withID("recipeId", rt.createComment))
	api.POST("/recipes/:recipeId/like", withID("recipeId", rt.likeRecipe))
	api.DELETE("/recipes/:recipeId/like", withID("recipeId", rt.unlikeRecipe))
	api.POST("/recipes/:recipeId/save", withID("recipeId", rt.saveRecipe))
	api.DELETE("/recipes/:recipeId/save", withID("recipeId", rt.unsaveRecipe))
	api.DELETE("/comments/:commentId", withID("commentId", rt.deleteComment))

	return router
}

func cors() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

func withID(field string, handler func(*gin.Context, int)) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, ok := parseID(c, c.Param(field), field)
		if !ok {
			return
		}
		handler(c, id)
	}
}

func (rt *Router) register(c *gin.Context) {
	var req model.RegisterRequest
	if !decode(c, &req) || !validateRegister(c, req) {
		return
	}

	user, err := rt.store.Register(req.Username, req.Email, req.Password)
	if err != nil {
		respondStoreError(c, err)
		return
	}
	token, _, err := rt.store.Login(req.Email, req.Password)
	if err != nil {
		respondStoreError(c, err)
		return
	}
	view.JSON(c, http.StatusCreated, model.AuthResponse{AccessToken: token, TokenType: "Bearer", User: user})
}

func (rt *Router) login(c *gin.Context) {
	var req model.LoginRequest
	if !decode(c, &req) || !validateLogin(c, req) {
		return
	}

	token, user, err := rt.store.Login(req.Email, req.Password)
	if err != nil {
		respondStoreError(c, err)
		return
	}
	view.JSON(c, http.StatusOK, model.AuthResponse{AccessToken: token, TokenType: "Bearer", User: user})
}

func (rt *Router) me(c *gin.Context) {
	user, ok := rt.requireUser(c)
	if ok {
		view.JSON(c, http.StatusOK, user)
	}
}

func (rt *Router) updateMe(c *gin.Context) {
	user, ok := rt.requireUser(c)
	if !ok {
		return
	}
	var req model.UpdateUserRequest
	if !decode(c, &req) || !validateUpdateUser(c, req) {
		return
	}
	updated, err := rt.store.UpdateUser(user.ID, req)
	if err != nil {
		respondStoreError(c, err)
		return
	}
	view.JSON(c, http.StatusOK, updated)
}

func (rt *Router) listRecipes(c *gin.Context, base store.RecipeFilter) {
	filter, ok := parseRecipeFilter(c, base)
	if !ok {
		return
	}
	view.JSON(c, http.StatusOK, rt.store.ListRecipes(filter))
}

func (rt *Router) createRecipe(c *gin.Context) {
	user, ok := rt.requireUser(c)
	if !ok {
		return
	}
	var req model.CreateRecipeRequest
	if !decode(c, &req) || !validateRecipe(c, req) {
		return
	}
	recipe, err := rt.store.CreateRecipe(user.ID, req)
	if err != nil {
		respondStoreError(c, err)
		return
	}
	view.JSON(c, http.StatusCreated, recipe)
}

func (rt *Router) getRecipe(c *gin.Context, recipeID int) {
	recipe, err := rt.store.GetRecipe(recipeID)
	if err != nil {
		respondStoreError(c, err)
		return
	}
	view.JSON(c, http.StatusOK, recipe)
}

func (rt *Router) updateRecipe(c *gin.Context, recipeID int) {
	user, ok := rt.requireUser(c)
	if !ok {
		return
	}
	var req model.UpdateRecipeRequest
	if !decode(c, &req) || !validateRecipe(c, req) {
		return
	}
	recipe, err := rt.store.UpdateRecipe(user.ID, recipeID, req)
	if err != nil {
		respondStoreError(c, err)
		return
	}
	view.JSON(c, http.StatusOK, recipe)
}

func (rt *Router) deleteRecipe(c *gin.Context, recipeID int) {
	user, ok := rt.requireUser(c)
	if !ok {
		return
	}
	if err := rt.store.DeleteRecipe(user.ID, recipeID); err != nil {
		respondStoreError(c, err)
		return
	}
	view.Empty(c, http.StatusNoContent)
}

func (rt *Router) listComments(c *gin.Context, recipeID int) {
	page, pageSize, ok := parsePagination(c)
	if !ok {
		return
	}
	comments, err := rt.store.ListComments(recipeID, page, pageSize)
	if err != nil {
		respondStoreError(c, err)
		return
	}
	view.JSON(c, http.StatusOK, comments)
}

func (rt *Router) createComment(c *gin.Context, recipeID int) {
	user, ok := rt.requireUser(c)
	if !ok {
		return
	}
	var req model.CreateCommentRequest
	if !decode(c, &req) || !validateComment(c, req) {
		return
	}
	comment, err := rt.store.CreateComment(user.ID, recipeID, req.Text)
	if err != nil {
		respondStoreError(c, err)
		return
	}
	view.JSON(c, http.StatusCreated, comment)
}

func (rt *Router) deleteComment(c *gin.Context, commentID int) {
	user, ok := rt.requireUser(c)
	if !ok {
		return
	}
	if err := rt.store.DeleteComment(user.ID, commentID); err != nil {
		respondStoreError(c, err)
		return
	}
	view.Empty(c, http.StatusNoContent)
}

func (rt *Router) likeRecipe(c *gin.Context, recipeID int) {
	user, ok := rt.requireUser(c)
	if !ok {
		return
	}
	if err := rt.store.LikeRecipe(user.ID, recipeID); err != nil {
		respondStoreError(c, err)
		return
	}
	view.Empty(c, http.StatusCreated)
}

func (rt *Router) unlikeRecipe(c *gin.Context, recipeID int) {
	user, ok := rt.requireUser(c)
	if !ok {
		return
	}
	if err := rt.store.UnlikeRecipe(user.ID, recipeID); err != nil {
		respondStoreError(c, err)
		return
	}
	view.Empty(c, http.StatusNoContent)
}

func (rt *Router) saveRecipe(c *gin.Context, recipeID int) {
	user, ok := rt.requireUser(c)
	if !ok {
		return
	}
	if err := rt.store.SaveRecipe(user.ID, recipeID); err != nil {
		respondStoreError(c, err)
		return
	}
	view.Empty(c, http.StatusCreated)
}

func (rt *Router) unsaveRecipe(c *gin.Context, recipeID int) {
	user, ok := rt.requireUser(c)
	if !ok {
		return
	}
	if err := rt.store.UnsaveRecipe(user.ID, recipeID); err != nil {
		respondStoreError(c, err)
		return
	}
	view.Empty(c, http.StatusNoContent)
}

func (rt *Router) savedRecipes(c *gin.Context) {
	user, ok := rt.requireUser(c)
	if !ok {
		return
	}
	rt.listRecipes(c, store.RecipeFilter{SavedByID: user.ID})
}

func (rt *Router) myRecipes(c *gin.Context) {
	user, ok := rt.requireUser(c)
	if !ok {
		return
	}
	rt.listRecipes(c, store.RecipeFilter{OwnerID: user.ID})
}

func (rt *Router) followUser(c *gin.Context, targetID int) {
	user, ok := rt.requireUser(c)
	if !ok {
		return
	}
	if err := rt.store.Follow(user.ID, targetID); err != nil {
		respondStoreError(c, err)
		return
	}
	view.Empty(c, http.StatusCreated)
}

func (rt *Router) unfollowUser(c *gin.Context, targetID int) {
	user, ok := rt.requireUser(c)
	if !ok {
		return
	}
	if err := rt.store.Unfollow(user.ID, targetID); err != nil {
		respondStoreError(c, err)
		return
	}
	view.Empty(c, http.StatusNoContent)
}

func (rt *Router) followers(c *gin.Context, userID int) {
	users, err := rt.store.Followers(userID)
	if err != nil {
		respondStoreError(c, err)
		return
	}
	view.JSON(c, http.StatusOK, users)
}

func (rt *Router) following(c *gin.Context, userID int) {
	users, err := rt.store.Following(userID)
	if err != nil {
		respondStoreError(c, err)
		return
	}
	view.JSON(c, http.StatusOK, users)
}

func (rt *Router) requireUser(c *gin.Context) (model.User, bool) {
	header := c.GetHeader("Authorization")
	token, ok := strings.CutPrefix(header, "Bearer ")
	if !ok || strings.TrimSpace(token) == "" {
		view.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "bearer token is required")
		return model.User{}, false
	}
	user, err := rt.store.UserByToken(strings.TrimSpace(token))
	if err != nil {
		view.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "invalid bearer token")
		return model.User{}, false
	}
	return user, true
}

func decode(c *gin.Context, target any) bool {
	defer c.Request.Body.Close()
	decoder := json.NewDecoder(c.Request.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		view.Error(c, http.StatusBadRequest, "BAD_REQUEST", "invalid JSON body")
		return false
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		view.Error(c, http.StatusBadRequest, "BAD_REQUEST", "request body must contain one JSON document")
		return false
	}
	return true
}

func parseID(c *gin.Context, raw string, field string) (int, bool) {
	id, err := strconv.Atoi(raw)
	if err != nil || id < 1 {
		view.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid path parameter", model.ErrorDetail{Field: field, Issue: "must be positive integer"})
		return 0, false
	}
	return id, true
}

func parsePagination(c *gin.Context) (int, int, bool) {
	page, ok := parseIntQuery(c, "page", 1, 1, 0)
	if !ok {
		return 0, 0, false
	}
	pageSize, ok := parseIntQuery(c, "page_size", 20, 1, 100)
	if !ok {
		return 0, 0, false
	}
	return page, pageSize, true
}

func parseRecipeFilter(c *gin.Context, base store.RecipeFilter) (store.RecipeFilter, bool) {
	page, pageSize, ok := parsePagination(c)
	if !ok {
		return store.RecipeFilter{}, false
	}
	base.Page = page
	base.PageSize = pageSize
	base.DishType = strings.TrimSpace(c.Query("dish_type"))
	base.Difficulty = strings.TrimSpace(c.Query("difficulty"))
	base.Sort = c.Query("sort")
	if base.Sort == "" {
		base.Sort = "created_at_desc"
	}
	if base.Difficulty != "" && !validDifficulty(base.Difficulty) {
		view.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid query parameter", model.ErrorDetail{Field: "difficulty", Issue: "must be easy, medium or hard"})
		return store.RecipeFilter{}, false
	}
	if base.Sort != "created_at_desc" && base.Sort != "likes_desc" {
		view.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid query parameter", model.ErrorDetail{Field: "sort", Issue: "must be created_at_desc or likes_desc"})
		return store.RecipeFilter{}, false
	}
	if raw := c.Query("ingredients"); raw != "" {
		for _, item := range strings.Split(raw, ",") {
			if value := strings.TrimSpace(item); value != "" {
				base.Ingredients = append(base.Ingredients, value)
			}
		}
	}
	return base, true
}

func parseIntQuery(c *gin.Context, name string, fallback int, min int, max int) (int, bool) {
	raw := c.Query(name)
	if raw == "" {
		return fallback, true
	}
	value, err := strconv.Atoi(raw)
	if err != nil || value < min || (max > 0 && value > max) {
		issue := "is out of allowed range"
		view.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid query parameter", model.ErrorDetail{Field: name, Issue: issue})
		return 0, false
	}
	return value, true
}

func validateRegister(c *gin.Context, req model.RegisterRequest) bool {
	var details []model.ErrorDetail
	if len(strings.TrimSpace(req.Username)) < 3 || len(req.Username) > 32 {
		details = append(details, model.ErrorDetail{Field: "username", Issue: "length must be between 3 and 32"})
	}
	if !looksLikeEmail(req.Email) {
		details = append(details, model.ErrorDetail{Field: "email", Issue: "must be valid email"})
	}
	if len(req.Password) < 8 || len(req.Password) > 72 {
		details = append(details, model.ErrorDetail{Field: "password", Issue: "length must be between 8 and 72"})
	}
	return validationResult(c, details)
}

func validateLogin(c *gin.Context, req model.LoginRequest) bool {
	var details []model.ErrorDetail
	if !looksLikeEmail(req.Email) {
		details = append(details, model.ErrorDetail{Field: "email", Issue: "must be valid email"})
	}
	if req.Password == "" {
		details = append(details, model.ErrorDetail{Field: "password", Issue: "is required"})
	}
	return validationResult(c, details)
}

func validateUpdateUser(c *gin.Context, req model.UpdateUserRequest) bool {
	var details []model.ErrorDetail
	if req.Username != nil && (len(strings.TrimSpace(*req.Username)) < 3 || len(*req.Username) > 32) {
		details = append(details, model.ErrorDetail{Field: "username", Issue: "length must be between 3 and 32"})
	}
	if req.Bio != nil && len(*req.Bio) > 2000 {
		details = append(details, model.ErrorDetail{Field: "bio", Issue: "length must be at most 2000"})
	}
	return validationResult(c, details)
}

func validateRecipe(c *gin.Context, req model.CreateRecipeRequest) bool {
	var details []model.ErrorDetail
	if len(strings.TrimSpace(req.Title)) < 3 || len(req.Title) > 255 {
		details = append(details, model.ErrorDetail{Field: "title", Issue: "length must be between 3 and 255"})
	}
	if req.Description != nil && len(*req.Description) > 10000 {
		details = append(details, model.ErrorDetail{Field: "description", Issue: "length must be at most 10000"})
	}
	if strings.TrimSpace(req.DishType) == "" || len(req.DishType) > 64 {
		details = append(details, model.ErrorDetail{Field: "dish_type", Issue: "is required and length must be at most 64"})
	}
	if !validDifficulty(req.Difficulty) {
		details = append(details, model.ErrorDetail{Field: "difficulty", Issue: "must be easy, medium or hard"})
	}
	if req.CookingTime != nil && *req.CookingTime < 1 {
		details = append(details, model.ErrorDetail{Field: "cooking_time", Issue: "must be greater than 0"})
	}
	if len(req.Ingredients) == 0 {
		details = append(details, model.ErrorDetail{Field: "ingredients", Issue: "must contain at least one item"})
	}
	for index, ingredient := range req.Ingredients {
		field := "ingredients[" + strconv.Itoa(index) + "]"
		if strings.TrimSpace(ingredient.Name) == "" || len(ingredient.Name) > 128 {
			details = append(details, model.ErrorDetail{Field: field + ".name", Issue: "is required and length must be at most 128"})
		}
		if strings.TrimSpace(ingredient.Amount) == "" || len(ingredient.Amount) > 64 {
			details = append(details, model.ErrorDetail{Field: field + ".amount", Issue: "is required and length must be at most 64"})
		}
	}
	if len(req.Steps) == 0 {
		details = append(details, model.ErrorDetail{Field: "steps", Issue: "must contain at least one item"})
	}
	for index, step := range req.Steps {
		field := "steps[" + strconv.Itoa(index) + "]"
		if step.StepNumber < 1 {
			details = append(details, model.ErrorDetail{Field: field + ".step_number", Issue: "must be greater than 0"})
		}
		if strings.TrimSpace(step.Text) == "" || len(step.Text) > 5000 {
			details = append(details, model.ErrorDetail{Field: field + ".text", Issue: "is required and length must be at most 5000"})
		}
	}
	return validationResult(c, details)
}

func validateComment(c *gin.Context, req model.CreateCommentRequest) bool {
	var details []model.ErrorDetail
	if strings.TrimSpace(req.Text) == "" || len(req.Text) > 2000 {
		details = append(details, model.ErrorDetail{Field: "text", Issue: "is required and length must be at most 2000"})
	}
	return validationResult(c, details)
}

func validationResult(c *gin.Context, details []model.ErrorDetail) bool {
	if len(details) == 0 {
		return true
	}
	view.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "request validation failed", details...)
	return false
}

func respondStoreError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, store.ErrUnauthorized):
		view.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "authorization failed")
	case errors.Is(err, store.ErrForbidden):
		view.Error(c, http.StatusForbidden, "FORBIDDEN", "access denied")
	case errors.Is(err, store.ErrNotFound):
		view.Error(c, http.StatusNotFound, "NOT_FOUND", "resource not found")
	case errors.Is(err, store.ErrConflict):
		view.Error(c, http.StatusConflict, "CONFLICT", "resource already exists")
	default:
		view.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "internal server error")
	}
}

func looksLikeEmail(value string) bool {
	value = strings.TrimSpace(value)
	at := strings.Index(value, "@")
	dot := strings.LastIndex(value, ".")
	return at > 0 && dot > at+1 && dot < len(value)-1
}

func validDifficulty(value string) bool {
	return value == "easy" || value == "medium" || value == "hard"
}
