package controller

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"

	"recipe-lab1/internal/model"
	"recipe-lab1/internal/store"
	"recipe-lab1/internal/view"
)

type Router struct {
	store *store.MemoryStore
}

func NewRouter(store *store.MemoryStore) *Router {
	return &Router{store: store}
}

func (rt *Router) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
	if r.Method == http.MethodOptions {
		view.Empty(w, http.StatusNoContent)
		return
	}

	if r.URL.Path == "/health" || r.URL.Path == "/api/v1/health" {
		view.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
		return
	}
	if !strings.HasPrefix(r.URL.Path, "/api/v1") {
		view.Error(w, http.StatusNotFound, "NOT_FOUND", "route not found")
		return
	}

	path := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1"), "/")
	if path == "" {
		view.JSON(w, http.StatusOK, map[string]string{"service": "Recipe Sharing and Culinary Blogs API"})
		return
	}

	segments := strings.Split(path, "/")
	switch segments[0] {
	case "auth":
		rt.authRoutes(w, r, segments)
	case "users":
		rt.userRoutes(w, r, segments)
	case "recipes":
		rt.recipeRoutes(w, r, segments)
	case "comments":
		rt.commentRoutes(w, r, segments)
	default:
		view.Error(w, http.StatusNotFound, "NOT_FOUND", "route not found")
	}
}

func (rt *Router) authRoutes(w http.ResponseWriter, r *http.Request, segments []string) {
	if len(segments) != 2 {
		view.Error(w, http.StatusNotFound, "NOT_FOUND", "route not found")
		return
	}

	switch segments[1] {
	case "register":
		if r.Method != http.MethodPost {
			methodNotAllowed(w)
			return
		}
		rt.register(w, r)
	case "login":
		if r.Method != http.MethodPost {
			methodNotAllowed(w)
			return
		}
		rt.login(w, r)
	default:
		view.Error(w, http.StatusNotFound, "NOT_FOUND", "route not found")
	}
}

func (rt *Router) userRoutes(w http.ResponseWriter, r *http.Request, segments []string) {
	if len(segments) >= 2 && segments[1] == "me" {
		rt.currentUserRoutes(w, r, segments)
		return
	}

	if len(segments) == 3 && segments[2] == "follow" {
		targetID, ok := parseID(w, segments[1], "userId")
		if !ok {
			return
		}
		if r.Method == http.MethodPost {
			rt.followUser(w, r, targetID)
			return
		}
		if r.Method == http.MethodDelete {
			rt.unfollowUser(w, r, targetID)
			return
		}
		methodNotAllowed(w)
		return
	}

	if len(segments) == 3 && segments[2] == "followers" {
		if r.Method != http.MethodGet {
			methodNotAllowed(w)
			return
		}
		userID, ok := parseID(w, segments[1], "userId")
		if ok {
			rt.followers(w, userID)
		}
		return
	}

	if len(segments) == 3 && segments[2] == "following" {
		if r.Method != http.MethodGet {
			methodNotAllowed(w)
			return
		}
		userID, ok := parseID(w, segments[1], "userId")
		if ok {
			rt.following(w, userID)
		}
		return
	}

	view.Error(w, http.StatusNotFound, "NOT_FOUND", "route not found")
}

func (rt *Router) currentUserRoutes(w http.ResponseWriter, r *http.Request, segments []string) {
	if len(segments) == 2 {
		if r.Method == http.MethodGet {
			rt.me(w, r)
			return
		}
		if r.Method == http.MethodPatch {
			rt.updateMe(w, r)
			return
		}
		methodNotAllowed(w)
		return
	}

	if len(segments) == 3 && segments[2] == "saved-recipes" {
		if r.Method != http.MethodGet {
			methodNotAllowed(w)
			return
		}
		rt.savedRecipes(w, r)
		return
	}

	if len(segments) == 3 && segments[2] == "recipes" {
		if r.Method != http.MethodGet {
			methodNotAllowed(w)
			return
		}
		rt.myRecipes(w, r)
		return
	}

	view.Error(w, http.StatusNotFound, "NOT_FOUND", "route not found")
}

func (rt *Router) recipeRoutes(w http.ResponseWriter, r *http.Request, segments []string) {
	if len(segments) == 1 {
		if r.Method == http.MethodGet {
			rt.listRecipes(w, r, store.RecipeFilter{})
			return
		}
		if r.Method == http.MethodPost {
			rt.createRecipe(w, r)
			return
		}
		methodNotAllowed(w)
		return
	}

	recipeID, ok := parseID(w, segments[1], "recipeId")
	if !ok {
		return
	}

	if len(segments) == 2 {
		if r.Method == http.MethodGet {
			rt.getRecipe(w, recipeID)
			return
		}
		if r.Method == http.MethodPut {
			rt.updateRecipe(w, r, recipeID)
			return
		}
		if r.Method == http.MethodDelete {
			rt.deleteRecipe(w, r, recipeID)
			return
		}
		methodNotAllowed(w)
		return
	}

	if len(segments) == 3 && segments[2] == "comments" {
		if r.Method == http.MethodGet {
			rt.listComments(w, r, recipeID)
			return
		}
		if r.Method == http.MethodPost {
			rt.createComment(w, r, recipeID)
			return
		}
		methodNotAllowed(w)
		return
	}

	if len(segments) == 3 && segments[2] == "like" {
		if r.Method == http.MethodPost {
			rt.likeRecipe(w, r, recipeID)
			return
		}
		if r.Method == http.MethodDelete {
			rt.unlikeRecipe(w, r, recipeID)
			return
		}
		methodNotAllowed(w)
		return
	}

	if len(segments) == 3 && segments[2] == "save" {
		if r.Method == http.MethodPost {
			rt.saveRecipe(w, r, recipeID)
			return
		}
		if r.Method == http.MethodDelete {
			rt.unsaveRecipe(w, r, recipeID)
			return
		}
		methodNotAllowed(w)
		return
	}

	view.Error(w, http.StatusNotFound, "NOT_FOUND", "route not found")
}

func (rt *Router) commentRoutes(w http.ResponseWriter, r *http.Request, segments []string) {
	if len(segments) == 2 && r.Method == http.MethodDelete {
		commentID, ok := parseID(w, segments[1], "commentId")
		if ok {
			rt.deleteComment(w, r, commentID)
		}
		return
	}
	if len(segments) == 2 {
		methodNotAllowed(w)
		return
	}
	view.Error(w, http.StatusNotFound, "NOT_FOUND", "route not found")
}

func (rt *Router) register(w http.ResponseWriter, r *http.Request) {
	var req model.RegisterRequest
	if !decode(w, r, &req) || !validateRegister(w, req) {
		return
	}

	user, err := rt.store.Register(req.Username, req.Email, req.Password)
	if err != nil {
		respondStoreError(w, err)
		return
	}
	token, _, err := rt.store.Login(req.Email, req.Password)
	if err != nil {
		respondStoreError(w, err)
		return
	}
	view.JSON(w, http.StatusCreated, model.AuthResponse{AccessToken: token, TokenType: "Bearer", User: user})
}

func (rt *Router) login(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest
	if !decode(w, r, &req) || !validateLogin(w, req) {
		return
	}

	token, user, err := rt.store.Login(req.Email, req.Password)
	if err != nil {
		respondStoreError(w, err)
		return
	}
	view.JSON(w, http.StatusOK, model.AuthResponse{AccessToken: token, TokenType: "Bearer", User: user})
}

func (rt *Router) me(w http.ResponseWriter, r *http.Request) {
	user, ok := rt.requireUser(w, r)
	if ok {
		view.JSON(w, http.StatusOK, user)
	}
}

func (rt *Router) updateMe(w http.ResponseWriter, r *http.Request) {
	user, ok := rt.requireUser(w, r)
	if !ok {
		return
	}
	var req model.UpdateUserRequest
	if !decode(w, r, &req) || !validateUpdateUser(w, req) {
		return
	}
	updated, err := rt.store.UpdateUser(user.ID, req)
	if err != nil {
		respondStoreError(w, err)
		return
	}
	view.JSON(w, http.StatusOK, updated)
}

func (rt *Router) listRecipes(w http.ResponseWriter, r *http.Request, base store.RecipeFilter) {
	filter, ok := parseRecipeFilter(w, r, base)
	if !ok {
		return
	}
	view.JSON(w, http.StatusOK, rt.store.ListRecipes(filter))
}

func (rt *Router) createRecipe(w http.ResponseWriter, r *http.Request) {
	user, ok := rt.requireUser(w, r)
	if !ok {
		return
	}
	var req model.CreateRecipeRequest
	if !decode(w, r, &req) || !validateRecipe(w, req) {
		return
	}
	recipe, err := rt.store.CreateRecipe(user.ID, req)
	if err != nil {
		respondStoreError(w, err)
		return
	}
	view.JSON(w, http.StatusCreated, recipe)
}

func (rt *Router) getRecipe(w http.ResponseWriter, recipeID int) {
	recipe, err := rt.store.GetRecipe(recipeID)
	if err != nil {
		respondStoreError(w, err)
		return
	}
	view.JSON(w, http.StatusOK, recipe)
}

func (rt *Router) updateRecipe(w http.ResponseWriter, r *http.Request, recipeID int) {
	user, ok := rt.requireUser(w, r)
	if !ok {
		return
	}
	var req model.UpdateRecipeRequest
	if !decode(w, r, &req) || !validateRecipe(w, req) {
		return
	}
	recipe, err := rt.store.UpdateRecipe(user.ID, recipeID, req)
	if err != nil {
		respondStoreError(w, err)
		return
	}
	view.JSON(w, http.StatusOK, recipe)
}

func (rt *Router) deleteRecipe(w http.ResponseWriter, r *http.Request, recipeID int) {
	user, ok := rt.requireUser(w, r)
	if !ok {
		return
	}
	if err := rt.store.DeleteRecipe(user.ID, recipeID); err != nil {
		respondStoreError(w, err)
		return
	}
	view.Empty(w, http.StatusNoContent)
}

func (rt *Router) listComments(w http.ResponseWriter, r *http.Request, recipeID int) {
	page, pageSize, ok := parsePagination(w, r)
	if !ok {
		return
	}
	comments, err := rt.store.ListComments(recipeID, page, pageSize)
	if err != nil {
		respondStoreError(w, err)
		return
	}
	view.JSON(w, http.StatusOK, comments)
}

func (rt *Router) createComment(w http.ResponseWriter, r *http.Request, recipeID int) {
	user, ok := rt.requireUser(w, r)
	if !ok {
		return
	}
	var req model.CreateCommentRequest
	if !decode(w, r, &req) || !validateComment(w, req) {
		return
	}
	comment, err := rt.store.CreateComment(user.ID, recipeID, req.Text)
	if err != nil {
		respondStoreError(w, err)
		return
	}
	view.JSON(w, http.StatusCreated, comment)
}

func (rt *Router) deleteComment(w http.ResponseWriter, r *http.Request, commentID int) {
	user, ok := rt.requireUser(w, r)
	if !ok {
		return
	}
	if err := rt.store.DeleteComment(user.ID, commentID); err != nil {
		respondStoreError(w, err)
		return
	}
	view.Empty(w, http.StatusNoContent)
}

func (rt *Router) likeRecipe(w http.ResponseWriter, r *http.Request, recipeID int) {
	user, ok := rt.requireUser(w, r)
	if !ok {
		return
	}
	if err := rt.store.LikeRecipe(user.ID, recipeID); err != nil {
		respondStoreError(w, err)
		return
	}
	view.Empty(w, http.StatusCreated)
}

func (rt *Router) unlikeRecipe(w http.ResponseWriter, r *http.Request, recipeID int) {
	user, ok := rt.requireUser(w, r)
	if !ok {
		return
	}
	if err := rt.store.UnlikeRecipe(user.ID, recipeID); err != nil {
		respondStoreError(w, err)
		return
	}
	view.Empty(w, http.StatusNoContent)
}

func (rt *Router) saveRecipe(w http.ResponseWriter, r *http.Request, recipeID int) {
	user, ok := rt.requireUser(w, r)
	if !ok {
		return
	}
	if err := rt.store.SaveRecipe(user.ID, recipeID); err != nil {
		respondStoreError(w, err)
		return
	}
	view.Empty(w, http.StatusCreated)
}

func (rt *Router) unsaveRecipe(w http.ResponseWriter, r *http.Request, recipeID int) {
	user, ok := rt.requireUser(w, r)
	if !ok {
		return
	}
	if err := rt.store.UnsaveRecipe(user.ID, recipeID); err != nil {
		respondStoreError(w, err)
		return
	}
	view.Empty(w, http.StatusNoContent)
}

func (rt *Router) savedRecipes(w http.ResponseWriter, r *http.Request) {
	user, ok := rt.requireUser(w, r)
	if !ok {
		return
	}
	rt.listRecipes(w, r, store.RecipeFilter{SavedByID: user.ID})
}

func (rt *Router) myRecipes(w http.ResponseWriter, r *http.Request) {
	user, ok := rt.requireUser(w, r)
	if !ok {
		return
	}
	rt.listRecipes(w, r, store.RecipeFilter{OwnerID: user.ID})
}

func (rt *Router) followUser(w http.ResponseWriter, r *http.Request, targetID int) {
	user, ok := rt.requireUser(w, r)
	if !ok {
		return
	}
	if err := rt.store.Follow(user.ID, targetID); err != nil {
		respondStoreError(w, err)
		return
	}
	view.Empty(w, http.StatusCreated)
}

func (rt *Router) unfollowUser(w http.ResponseWriter, r *http.Request, targetID int) {
	user, ok := rt.requireUser(w, r)
	if !ok {
		return
	}
	if err := rt.store.Unfollow(user.ID, targetID); err != nil {
		respondStoreError(w, err)
		return
	}
	view.Empty(w, http.StatusNoContent)
}

func (rt *Router) followers(w http.ResponseWriter, userID int) {
	users, err := rt.store.Followers(userID)
	if err != nil {
		respondStoreError(w, err)
		return
	}
	view.JSON(w, http.StatusOK, users)
}

func (rt *Router) following(w http.ResponseWriter, userID int) {
	users, err := rt.store.Following(userID)
	if err != nil {
		respondStoreError(w, err)
		return
	}
	view.JSON(w, http.StatusOK, users)
}

func (rt *Router) requireUser(w http.ResponseWriter, r *http.Request) (model.User, bool) {
	header := r.Header.Get("Authorization")
	token, ok := strings.CutPrefix(header, "Bearer ")
	if !ok || strings.TrimSpace(token) == "" {
		view.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "bearer token is required")
		return model.User{}, false
	}
	user, err := rt.store.UserByToken(strings.TrimSpace(token))
	if err != nil {
		view.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid bearer token")
		return model.User{}, false
	}
	return user, true
}

func decode(w http.ResponseWriter, r *http.Request, target any) bool {
	defer r.Body.Close()
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		view.Error(w, http.StatusBadRequest, "BAD_REQUEST", "invalid JSON body")
		return false
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		view.Error(w, http.StatusBadRequest, "BAD_REQUEST", "request body must contain one JSON document")
		return false
	}
	return true
}

func parseID(w http.ResponseWriter, raw string, field string) (int, bool) {
	id, err := strconv.Atoi(raw)
	if err != nil || id < 1 {
		view.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid path parameter", model.ErrorDetail{Field: field, Issue: "must be positive integer"})
		return 0, false
	}
	return id, true
}

func parsePagination(w http.ResponseWriter, r *http.Request) (int, int, bool) {
	page, ok := parseIntQuery(w, r, "page", 1, 1, 0)
	if !ok {
		return 0, 0, false
	}
	pageSize, ok := parseIntQuery(w, r, "page_size", 20, 1, 100)
	if !ok {
		return 0, 0, false
	}
	return page, pageSize, true
}

func parseRecipeFilter(w http.ResponseWriter, r *http.Request, base store.RecipeFilter) (store.RecipeFilter, bool) {
	page, pageSize, ok := parsePagination(w, r)
	if !ok {
		return store.RecipeFilter{}, false
	}
	query := r.URL.Query()
	base.Page = page
	base.PageSize = pageSize
	base.DishType = strings.TrimSpace(query.Get("dish_type"))
	base.Difficulty = strings.TrimSpace(query.Get("difficulty"))
	base.Sort = query.Get("sort")
	if base.Sort == "" {
		base.Sort = "created_at_desc"
	}
	if base.Difficulty != "" && !validDifficulty(base.Difficulty) {
		view.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid query parameter", model.ErrorDetail{Field: "difficulty", Issue: "must be easy, medium or hard"})
		return store.RecipeFilter{}, false
	}
	if base.Sort != "created_at_desc" && base.Sort != "likes_desc" {
		view.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid query parameter", model.ErrorDetail{Field: "sort", Issue: "must be created_at_desc or likes_desc"})
		return store.RecipeFilter{}, false
	}
	if raw := query.Get("ingredients"); raw != "" {
		for _, item := range strings.Split(raw, ",") {
			if value := strings.TrimSpace(item); value != "" {
				base.Ingredients = append(base.Ingredients, value)
			}
		}
	}
	return base, true
}

func parseIntQuery(w http.ResponseWriter, r *http.Request, name string, fallback int, min int, max int) (int, bool) {
	raw := r.URL.Query().Get(name)
	if raw == "" {
		return fallback, true
	}
	value, err := strconv.Atoi(raw)
	if err != nil || value < min || (max > 0 && value > max) {
		issue := "is out of allowed range"
		view.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid query parameter", model.ErrorDetail{Field: name, Issue: issue})
		return 0, false
	}
	return value, true
}

func validateRegister(w http.ResponseWriter, req model.RegisterRequest) bool {
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
	return validationResult(w, details)
}

func validateLogin(w http.ResponseWriter, req model.LoginRequest) bool {
	var details []model.ErrorDetail
	if !looksLikeEmail(req.Email) {
		details = append(details, model.ErrorDetail{Field: "email", Issue: "must be valid email"})
	}
	if req.Password == "" {
		details = append(details, model.ErrorDetail{Field: "password", Issue: "is required"})
	}
	return validationResult(w, details)
}

func validateUpdateUser(w http.ResponseWriter, req model.UpdateUserRequest) bool {
	var details []model.ErrorDetail
	if req.Username != nil && (len(strings.TrimSpace(*req.Username)) < 3 || len(*req.Username) > 32) {
		details = append(details, model.ErrorDetail{Field: "username", Issue: "length must be between 3 and 32"})
	}
	if req.Bio != nil && len(*req.Bio) > 2000 {
		details = append(details, model.ErrorDetail{Field: "bio", Issue: "length must be at most 2000"})
	}
	return validationResult(w, details)
}

func validateRecipe(w http.ResponseWriter, req model.CreateRecipeRequest) bool {
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
	return validationResult(w, details)
}

func validateComment(w http.ResponseWriter, req model.CreateCommentRequest) bool {
	var details []model.ErrorDetail
	if strings.TrimSpace(req.Text) == "" || len(req.Text) > 2000 {
		details = append(details, model.ErrorDetail{Field: "text", Issue: "is required and length must be at most 2000"})
	}
	return validationResult(w, details)
}

func validationResult(w http.ResponseWriter, details []model.ErrorDetail) bool {
	if len(details) == 0 {
		return true
	}
	view.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "request validation failed", details...)
	return false
}

func respondStoreError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, store.ErrUnauthorized):
		view.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "authorization failed")
	case errors.Is(err, store.ErrForbidden):
		view.Error(w, http.StatusForbidden, "FORBIDDEN", "access denied")
	case errors.Is(err, store.ErrNotFound):
		view.Error(w, http.StatusNotFound, "NOT_FOUND", "resource not found")
	case errors.Is(err, store.ErrConflict):
		view.Error(w, http.StatusConflict, "CONFLICT", "resource already exists")
	default:
		view.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "internal server error")
	}
}

func methodNotAllowed(w http.ResponseWriter) {
	view.Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "method not allowed")
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
