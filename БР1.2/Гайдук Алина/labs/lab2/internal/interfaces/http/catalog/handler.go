package catalog

import (
	"encoding/json"
	"errors"
	"net/http"

	"recipehub/internal/api"
	"recipehub/internal/api/httpx"
	catalogusecase "recipehub/internal/usecase/catalog"
)

const defaultIngredientLimit = 20

// Handler exposes catalog use cases over HTTP.
type Handler struct {
	service *catalogusecase.Service
}

// NewHandler creates a catalog HTTP handler.
func NewHandler(service *catalogusecase.Service) *Handler {
	return &Handler{service: service}
}

// ListDishTypes handles GET /api/v1/dish-types.
func (h *Handler) ListDishTypes(w http.ResponseWriter, r *http.Request) {
	rows, err := h.service.ListDishTypes(r.Context())
	if err != nil {
		respondInternal(w)
		return
	}

	out := make([]dishTypeResponse, 0, len(rows))
	for _, row := range rows {
		out = append(out, toDishTypeResponse(row))
	}

	api.RespondJSON(w, http.StatusOK, map[string]any{"data": out})
}

// CreateDishType handles POST /api/v1/dish-types.
func (h *Handler) CreateDishType(w http.ResponseWriter, r *http.Request) {
	var body referenceNameRequest
	if !decodeJSON(w, r, &body) {
		return
	}

	row, err := h.service.CreateDishType(r.Context(), body.Name)
	if respondCreateError(w, err, "dish type already exists") {
		return
	}

	api.RespondJSON(w, http.StatusCreated, map[string]any{"data": toDishTypeResponse(row)})
}

// ListDifficulties handles GET /api/v1/difficulties.
func (h *Handler) ListDifficulties(w http.ResponseWriter, r *http.Request) {
	rows, err := h.service.ListDifficulties(r.Context())
	if err != nil {
		respondInternal(w)
		return
	}

	out := make([]difficultyResponse, 0, len(rows))
	for _, row := range rows {
		out = append(out, toDifficultyResponse(row))
	}

	api.RespondJSON(w, http.StatusOK, map[string]any{"data": out})
}

// ListTags handles GET /api/v1/tags.
func (h *Handler) ListTags(w http.ResponseWriter, r *http.Request) {
	rows, err := h.service.ListTags(r.Context())
	if err != nil {
		respondInternal(w)
		return
	}

	out := make([]tagResponse, 0, len(rows))
	for _, row := range rows {
		out = append(out, toTagResponse(row))
	}

	api.RespondJSON(w, http.StatusOK, map[string]any{"data": out})
}

// CreateTag handles POST /api/v1/tags.
func (h *Handler) CreateTag(w http.ResponseWriter, r *http.Request) {
	var body referenceNameRequest
	if !decodeJSON(w, r, &body) {
		return
	}

	row, err := h.service.CreateTag(r.Context(), body.Name)
	if respondCreateError(w, err, "tag already exists") {
		return
	}

	api.RespondJSON(w, http.StatusCreated, map[string]any{"data": toTagResponse(row)})
}

// ListIngredients handles GET /api/v1/ingredients.
func (h *Handler) ListIngredients(w http.ResponseWriter, r *http.Request) {
	limit, _ := httpx.ClampLimitOffset(r, defaultIngredientLimit)
	rows, err := h.service.SearchIngredients(r.Context(), r.URL.Query().Get("q"), limit)
	if err != nil {
		respondInternal(w)
		return
	}

	out := make([]ingredientResponse, 0, len(rows))
	for _, row := range rows {
		out = append(out, toIngredientResponse(row))
	}

	api.RespondJSON(w, http.StatusOK, map[string]any{"data": out})
}

// CreateIngredient handles POST /api/v1/ingredients.
func (h *Handler) CreateIngredient(w http.ResponseWriter, r *http.Request) {
	var body referenceNameRequest
	if !decodeJSON(w, r, &body) {
		return
	}

	row, err := h.service.CreateIngredient(r.Context(), body.Name)
	if respondCreateError(w, err, "ingredient already exists") {
		return
	}

	api.RespondJSON(w, http.StatusCreated, map[string]any{"data": toIngredientResponse(row)})
}

// ValidateIDs handles POST /internal/v1/catalog/validate-ids.
func (h *Handler) ValidateIDs(w http.ResponseWriter, r *http.Request) {
	var body validateIDsRequest
	if !decodeJSON(w, r, &body) {
		return
	}

	result, err := h.service.ValidateIDs(r.Context(), toValidateIDsDomain(body))
	if err != nil {
		respondInternal(w)
		return
	}

	api.RespondJSON(w, http.StatusOK, toValidateIDsResponse(result))
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid JSON")
		return false
	}

	return true
}

func respondCreateError(w http.ResponseWriter, err error, conflictMessage string) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, catalogusecase.ErrInvalidName) {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "name must be non-empty and within length limit")
		return true
	}
	if errors.Is(err, catalogusecase.ErrAlreadyExists) {
		api.RespondError(w, http.StatusConflict, "CONFLICT", conflictMessage)
		return true
	}

	respondInternal(w)
	return true
}

func respondInternal(w http.ResponseWriter) {
	api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "internal server error")
}
