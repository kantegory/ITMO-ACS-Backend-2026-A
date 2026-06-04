package blog

import (
	"encoding/json"
	"errors"
	"net/http"

	"recipehub/internal/api"
	"recipehub/internal/api/dto"
	"recipehub/internal/api/httpx"
	"recipehub/internal/pkg/authctx"
	blogusecase "recipehub/internal/usecase/blog"
)

const defaultPostLimit = 20

// Handler exposes blog use cases over HTTP.
type Handler struct {
	service *blogusecase.Service
}

// NewHandler creates a blog HTTP handler.
func NewHandler(service *blogusecase.Service) *Handler {
	return &Handler{service: service}
}

// List handles GET /api/v1/posts.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	limit, offset := httpx.ClampLimitOffset(r, defaultPostLimit)
	page, err := h.service.ListPosts(r.Context(), limit, offset, viewerID(r))
	if respondBlogError(w, err) {
		return
	}

	items := make([]postListItemResponse, 0, len(page.Items))
	for _, item := range page.Items {
		items = append(items, toPostListItemResponse(item))
	}

	api.RespondJSON(w, http.StatusOK, map[string]any{
		"data":       items,
		"pagination": dto.Pagination{Total: page.Total, Limit: limit, Offset: offset},
	})
}

// ListByAuthor handles GET /api/v1/users/{id}/posts.
func (h *Handler) ListByAuthor(w http.ResponseWriter, r *http.Request) {
	authorID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	limit, offset := httpx.ClampLimitOffset(r, defaultPostLimit)
	page, err := h.service.ListPostsByAuthor(r.Context(), authorID, limit, offset, viewerID(r))
	if respondBlogError(w, err) {
		return
	}

	items := make([]postListItemResponse, 0, len(page.Items))
	for _, item := range page.Items {
		items = append(items, toPostListItemResponse(item))
	}

	api.RespondJSON(w, http.StatusOK, map[string]any{
		"data":       items,
		"pagination": dto.Pagination{Total: page.Total, Limit: limit, Offset: offset},
	})
}

// Create handles POST /api/v1/posts.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	authorID, ok := authctx.UserID(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	var body createPostRequest
	if !decodeJSON(w, r, &body) {
		return
	}

	post, err := h.service.CreatePost(r.Context(), toCreateInput(body, authorID))
	if respondBlogError(w, err) {
		return
	}

	api.RespondJSON(w, http.StatusCreated, map[string]any{"data": toPostFullResponse(post)})
}

// GetByID handles GET /api/v1/posts/{id}.
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	postID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	post, err := h.service.GetPost(r.Context(), postID, viewerID(r))
	if respondBlogError(w, err) {
		return
	}

	api.RespondJSON(w, http.StatusOK, map[string]any{"data": toPostFullResponse(post)})
}

func viewerID(r *http.Request) *uint64 {
	userID, ok := authctx.UserID(r.Context())
	if !ok {
		return nil
	}

	return &userID
}

// Patch handles PATCH /api/v1/posts/{id}.
func (h *Handler) Patch(w http.ResponseWriter, r *http.Request) {
	actorID, ok := authctx.UserID(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	postID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	var body patchPostRequest
	if !decodeJSON(w, r, &body) {
		return
	}

	post, err := h.service.PatchPost(r.Context(), postID, toPatchInput(body, actorID))
	if respondBlogError(w, err) {
		return
	}

	api.RespondJSON(w, http.StatusOK, map[string]any{"data": toPostFullResponse(post)})
}

// Delete handles DELETE /api/v1/posts/{id}.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	actorID, ok := authctx.UserID(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	postID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	if respondBlogError(w, h.service.DeletePost(r.Context(), postID, actorID)) {
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Exists handles GET /internal/v1/posts/{id}/exists.
func (h *Handler) Exists(w http.ResponseWriter, r *http.Request) {
	postID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	exists, err := h.service.PostExists(r.Context(), postID)
	if respondBlogError(w, err) {
		return
	}

	api.RespondJSON(w, http.StatusOK, existsResponse{Exists: exists})
}

// Brief handles GET /internal/v1/posts/{id}/brief.
func (h *Handler) Brief(w http.ResponseWriter, r *http.Request) {
	postID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	post, err := h.service.PostBrief(r.Context(), postID)
	if respondBlogError(w, err) {
		return
	}

	api.RespondJSON(w, http.StatusOK, toPostBriefResponse(post))
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid JSON")
		return false
	}

	return true
}

func respondBlogError(w http.ResponseWriter, err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, blogusecase.ErrInvalidInput) {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "check request fields")
		return true
	}
	if errors.Is(err, blogusecase.ErrNotFound) {
		api.RespondError(w, http.StatusNotFound, "NOT_FOUND", "entity not found")
		return true
	}
	if errors.Is(err, blogusecase.ErrForbidden) {
		api.RespondError(w, http.StatusForbidden, "FORBIDDEN", "action forbidden")
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
