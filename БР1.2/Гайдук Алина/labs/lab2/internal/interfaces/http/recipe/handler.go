package recipe

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"recipehub/internal/api"
	"recipehub/internal/api/dto"
	"recipehub/internal/api/httpx"
	recipedomain "recipehub/internal/domain/recipe"
	"recipehub/internal/pkg/authctx"
	recipeusecase "recipehub/internal/usecase/recipe"
)

const defaultRecipeLimit = 20

// Handler exposes recipe use cases over HTTP.
type Handler struct {
	service *recipeusecase.Service
}

// NewHandler creates a recipe HTTP handler.
func NewHandler(service *recipeusecase.Service) *Handler {
	return &Handler{service: service}
}

// List handles GET /api/v1/recipes.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	filters, ok := parseFilters(w, r)
	if !ok {
		return
	}

	page, err := h.service.ListRecipes(r.Context(), filters)
	if respondRecipeError(w, err) {
		return
	}

	items := make([]recipeResponse, 0, len(page.Items))
	for _, item := range page.Items {
		items = append(items, toRecipeResponse(item, false))
	}

	api.RespondJSON(w, http.StatusOK, map[string]any{
		"data":       items,
		"pagination": dto.Pagination{Total: page.Total, Limit: filters.Limit, Offset: filters.Offset},
	})
}

// ListByAuthor handles GET /api/v1/users/{id}/recipes.
func (h *Handler) ListByAuthor(w http.ResponseWriter, r *http.Request) {
	authorID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	limit, offset := httpx.ClampLimitOffset(r, defaultRecipeLimit)
	page, err := h.service.ListRecipes(r.Context(), recipedomain.Filters{
		AuthorID: &authorID,
		ViewerID: viewerID(r),
		Limit:    limit,
		Offset:   offset,
	})
	if respondRecipeError(w, err) {
		return
	}

	items := make([]recipeResponse, 0, len(page.Items))
	for _, item := range page.Items {
		items = append(items, toRecipeResponse(item, false))
	}

	api.RespondJSON(w, http.StatusOK, map[string]any{
		"data":       items,
		"pagination": dto.Pagination{Total: page.Total, Limit: limit, Offset: offset},
	})
}

// Create handles POST /api/v1/recipes.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	authorID, ok := authctx.UserID(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	var body createRecipeRequest
	if !decodeJSON(w, r, &body) {
		return
	}

	created, err := h.service.CreateRecipe(r.Context(), toDomainRecipe(body, authorID))
	if respondRecipeError(w, err) {
		return
	}

	api.RespondJSON(w, http.StatusCreated, map[string]any{"data": toRecipeResponse(created, true)})
}

// GetByID handles GET /api/v1/recipes/{id}.
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	recipeID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	recipe, err := h.service.GetRecipe(r.Context(), recipeID, viewerID(r))
	if respondRecipeError(w, err) {
		return
	}

	api.RespondJSON(w, http.StatusOK, map[string]any{"data": toRecipeResponse(recipe, true)})
}

// Patch handles PATCH /api/v1/recipes/{id}.
func (h *Handler) Patch(w http.ResponseWriter, r *http.Request) {
	actorID, ok := authctx.UserID(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	recipeID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	var body patchRecipeRequest
	if !decodeJSON(w, r, &body) {
		return
	}

	updated, err := h.service.PatchRecipe(r.Context(), recipeID, actorID, toDomainRecipe(body, actorID))
	if respondRecipeError(w, err) {
		return
	}

	api.RespondJSON(w, http.StatusOK, map[string]any{"data": toRecipeResponse(updated, true)})
}

// Delete handles DELETE /api/v1/recipes/{id}.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	actorID, ok := authctx.UserID(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	recipeID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	if respondRecipeError(w, h.service.DeleteRecipe(r.Context(), recipeID, actorID)) {
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Exists handles GET /internal/v1/recipes/{id}/exists.
func (h *Handler) Exists(w http.ResponseWriter, r *http.Request) {
	recipeID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	exists, err := h.service.RecipeExists(r.Context(), recipeID)
	if respondRecipeError(w, err) {
		return
	}

	api.RespondJSON(w, http.StatusOK, existsResponse{Exists: exists})
}

// Brief handles GET /internal/v1/recipes/{id}/brief.
func (h *Handler) Brief(w http.ResponseWriter, r *http.Request) {
	recipeID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	recipe, err := h.service.RecipeBrief(r.Context(), recipeID)
	if respondRecipeError(w, err) {
		return
	}

	api.RespondJSON(w, http.StatusOK, toBriefResponse(recipe))
}

// AuthorRecipeCount handles GET /internal/v1/authors/{userId}/recipe-count.
func (h *Handler) AuthorRecipeCount(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UintPath(r, "userId")
	if !ok {
		respondBadID(w)
		return
	}

	count, err := h.service.AuthorRecipeCount(r.Context(), userID)
	if respondRecipeError(w, err) {
		return
	}

	api.RespondJSON(w, http.StatusOK, countResponse{Count: count})
}

func parseFilters(w http.ResponseWriter, r *http.Request) (recipedomain.Filters, bool) {
	limit, offset := httpx.ClampLimitOffset(r, defaultRecipeLimit)
	filters := recipedomain.Filters{Limit: limit, Offset: offset}
	filters.ViewerID = viewerID(r)
	query := r.URL.Query()
	filters.Search = strings.TrimSpace(query.Get("search"))

	if !parseOptionalUint(w, query.Get("dish_type_id"), &filters.DishTypeID) {
		return recipedomain.Filters{}, false
	}
	if !parseOptionalUint(w, query.Get("difficulty_id"), &filters.DifficultyID) {
		return recipedomain.Filters{}, false
	}
	if raw := strings.TrimSpace(query.Get("ingredient_ids")); raw != "" {
		ids, err := httpx.ParseCommaUintsStrict(raw)
		if err != nil {
			respondBadID(w)
			return recipedomain.Filters{}, false
		}
		filters.IngredientIDs = ids
	}
	if raw := strings.TrimSpace(query.Get("tag_ids")); raw != "" {
		ids, err := httpx.ParseCommaUintsStrict(raw)
		if err != nil {
			respondBadID(w)
			return recipedomain.Filters{}, false
		}
		filters.TagIDs = ids
	}

	return filters, true
}

func viewerID(r *http.Request) *uint64 {
	userID, ok := authctx.UserID(r.Context())
	if !ok {
		return nil
	}

	return &userID
}

func parseOptionalUint(w http.ResponseWriter, raw string, out **uint64) bool {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return true
	}

	id, err := strconv.ParseUint(raw, 10, 64)
	if err != nil {
		respondBadID(w)
		return false
	}
	if id != 0 {
		*out = &id
	}

	return true
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid JSON")
		return false
	}

	return true
}

func respondRecipeError(w http.ResponseWriter, err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, recipeusecase.ErrInvalidInput) || errors.Is(err, recipeusecase.ErrInvalidRefs) {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "check request fields")
		return true
	}
	if errors.Is(err, recipeusecase.ErrNotFound) {
		api.RespondError(w, http.StatusNotFound, "NOT_FOUND", "entity not found")
		return true
	}
	if errors.Is(err, recipeusecase.ErrForbidden) {
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
