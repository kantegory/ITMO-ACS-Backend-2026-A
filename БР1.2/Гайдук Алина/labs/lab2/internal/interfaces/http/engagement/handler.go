package engagement

import (
	"encoding/json"
	"errors"
	"net/http"

	"recipehub/internal/api"
	"recipehub/internal/api/dto"
	"recipehub/internal/api/httpx"
	engagementdomain "recipehub/internal/domain/engagement"
	"recipehub/internal/pkg/authctx"
	engagementusecase "recipehub/internal/usecase/engagement"
)

const defaultListLimit = 20

// Handler exposes engagement use cases over HTTP.
type Handler struct {
	service *engagementusecase.Service
}

// NewHandler creates an engagement HTTP handler.
func NewHandler(service *engagementusecase.Service) *Handler {
	return &Handler{service: service}
}

// ListRecipeComments handles GET /api/v1/recipes/{id}/comments.
func (h *Handler) ListRecipeComments(w http.ResponseWriter, r *http.Request) {
	h.listComments(w, r, engagementdomain.TargetRecipe)
}

// ListPostComments handles GET /api/v1/posts/{id}/comments.
func (h *Handler) ListPostComments(w http.ResponseWriter, r *http.Request) {
	h.listComments(w, r, engagementdomain.TargetPost)
}

// CreateRecipeComment handles POST /api/v1/recipes/{id}/comments.
func (h *Handler) CreateRecipeComment(w http.ResponseWriter, r *http.Request) {
	h.createComment(w, r, engagementdomain.TargetRecipe)
}

// CreatePostComment handles POST /api/v1/posts/{id}/comments.
func (h *Handler) CreatePostComment(w http.ResponseWriter, r *http.Request) {
	h.createComment(w, r, engagementdomain.TargetPost)
}

// DeleteComment handles DELETE /api/v1/comments/{id}.
func (h *Handler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.UserID(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	commentID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	if respondEngagementError(w, h.service.DeleteComment(r.Context(), commentID, userID)) {
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// RecipeLike handles POST /api/v1/recipes/{id}/like.
func (h *Handler) RecipeLike(w http.ResponseWriter, r *http.Request) {
	h.like(w, r, engagementdomain.TargetRecipe, true)
}

// RecipeUnlike handles DELETE /api/v1/recipes/{id}/like.
func (h *Handler) RecipeUnlike(w http.ResponseWriter, r *http.Request) {
	h.like(w, r, engagementdomain.TargetRecipe, false)
}

// PostLike handles POST /api/v1/posts/{id}/like.
func (h *Handler) PostLike(w http.ResponseWriter, r *http.Request) {
	h.like(w, r, engagementdomain.TargetPost, true)
}

// PostUnlike handles DELETE /api/v1/posts/{id}/like.
func (h *Handler) PostUnlike(w http.ResponseWriter, r *http.Request) {
	h.like(w, r, engagementdomain.TargetPost, false)
}

// SaveRecipe handles POST /api/v1/recipes/{id}/save.
func (h *Handler) SaveRecipe(w http.ResponseWriter, r *http.Request) {
	h.saveRecipe(w, r, true)
}

// UnsaveRecipe handles DELETE /api/v1/recipes/{id}/save.
func (h *Handler) UnsaveRecipe(w http.ResponseWriter, r *http.Request) {
	h.saveRecipe(w, r, false)
}

// ListSavedRecipes handles GET /api/v1/users/me/saved.
func (h *Handler) ListSavedRecipes(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.UserID(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	limit, offset := httpx.ClampLimitOffset(r, defaultListLimit)
	page, err := h.service.ListSavedRecipes(r.Context(), userID, limit, offset)
	if respondEngagementError(w, err) {
		return
	}

	items := make([]recipeBriefResponse, 0, len(page.Items))
	for _, recipe := range page.Items {
		items = append(items, toRecipeBriefResponse(recipe))
	}

	api.RespondJSON(w, http.StatusOK, map[string]any{
		"data":       items,
		"pagination": dto.Pagination{Total: page.Total, Limit: limit, Offset: offset},
	})
}

// RecipeStatsBatch handles POST /internal/v1/stats/recipes/batch.
func (h *Handler) RecipeStatsBatch(w http.ResponseWriter, r *http.Request) {
	var body recipeStatsBatchRequest
	if !decodeJSON(w, r, &body) {
		return
	}

	stats, err := h.service.StatsBatch(r.Context(), engagementdomain.TargetRecipe, body.RecipeIDs, body.ViewerID)
	if respondEngagementError(w, err) {
		return
	}

	out := make([]recipeStatsItemResponse, 0, len(stats))
	for _, stat := range stats {
		out = append(out, recipeStatsItemResponse{
			RecipeID:      stat.TargetID,
			LikesCount:    stat.LikesCount,
			CommentsCount: stat.CommentsCount,
			IsLiked:       stat.IsLiked,
			IsSaved:       stat.IsSaved,
		})
	}

	api.RespondJSON(w, http.StatusOK, map[string]any{"stats": out})
}

// PostStatsBatch handles POST /internal/v1/stats/posts/batch.
func (h *Handler) PostStatsBatch(w http.ResponseWriter, r *http.Request) {
	var body postStatsBatchRequest
	if !decodeJSON(w, r, &body) {
		return
	}

	stats, err := h.service.StatsBatch(r.Context(), engagementdomain.TargetPost, body.PostIDs, body.ViewerID)
	if respondEngagementError(w, err) {
		return
	}

	out := make([]postStatsItemResponse, 0, len(stats))
	for _, stat := range stats {
		out = append(out, postStatsItemResponse{
			PostID:        stat.TargetID,
			LikesCount:    stat.LikesCount,
			CommentsCount: stat.CommentsCount,
			IsLiked:       stat.IsLiked,
		})
	}

	api.RespondJSON(w, http.StatusOK, map[string]any{"stats": out})
}

func (h *Handler) listComments(w http.ResponseWriter, r *http.Request, target engagementdomain.TargetType) {
	targetID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	limit, offset := httpx.ClampLimitOffset(r, defaultListLimit)
	page, err := h.service.ListComments(r.Context(), target, targetID, limit, offset)
	if respondEngagementError(w, err) {
		return
	}

	items := make([]commentResponse, 0, len(page.Items))
	for _, item := range page.Items {
		items = append(items, toCommentResponse(item))
	}

	api.RespondJSON(w, http.StatusOK, map[string]any{
		"data":       items,
		"pagination": dto.Pagination{Total: page.Total, Limit: limit, Offset: offset},
	})
}

func (h *Handler) createComment(w http.ResponseWriter, r *http.Request, target engagementdomain.TargetType) {
	userID, ok := authctx.UserID(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	targetID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	var body createCommentRequest
	if !decodeJSON(w, r, &body) {
		return
	}

	comment, err := h.service.CreateComment(r.Context(), target, targetID, userID, body.Content, body.ParentCommentID)
	if respondEngagementError(w, err) {
		return
	}

	api.RespondJSON(w, http.StatusCreated, map[string]any{"data": toCommentResponse(comment)})
}

func (h *Handler) like(w http.ResponseWriter, r *http.Request, target engagementdomain.TargetType, liked bool) {
	userID, ok := authctx.UserID(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	targetID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	var count int64
	var err error
	if liked {
		count, err = h.service.Like(r.Context(), target, userID, targetID)
	} else {
		count, err = h.service.Unlike(r.Context(), target, userID, targetID)
	}
	if respondEngagementError(w, err) {
		return
	}

	status := http.StatusOK
	if liked {
		status = http.StatusCreated
	}
	api.RespondJSON(w, status, map[string]any{"data": likedResponse{Liked: liked, LikesCount: count}})
}

func (h *Handler) saveRecipe(w http.ResponseWriter, r *http.Request, saved bool) {
	userID, ok := authctx.UserID(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	recipeID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	var err error
	if saved {
		err = h.service.SaveRecipe(r.Context(), userID, recipeID)
	} else {
		err = h.service.UnsaveRecipe(r.Context(), userID, recipeID)
	}
	if respondEngagementError(w, err) {
		return
	}

	status := http.StatusOK
	if saved {
		status = http.StatusCreated
	}
	api.RespondJSON(w, status, map[string]any{"data": savedResponse{Saved: saved}})
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid JSON")
		return false
	}

	return true
}

func respondEngagementError(w http.ResponseWriter, err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, engagementusecase.ErrInvalidInput) {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "check request fields")
		return true
	}
	if errors.Is(err, engagementusecase.ErrNotFound) {
		api.RespondError(w, http.StatusNotFound, "NOT_FOUND", "entity not found")
		return true
	}
	if errors.Is(err, engagementusecase.ErrForbidden) {
		api.RespondError(w, http.StatusForbidden, "FORBIDDEN", "action forbidden")
		return true
	}
	if errors.Is(err, engagementusecase.ErrAlreadyExists) {
		api.RespondError(w, http.StatusConflict, "CONFLICT", "already exists")
		return true
	}

	api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "internal server error")
	return true
}

func respondBadID(w http.ResponseWriter) {
	api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid id")
}

func respondUnauthorized(w http.ResponseWriter) {
	api.RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "authorization required")
}
