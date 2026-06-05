package saved

import (
	"net/http"

	"recipehub/internal/api"
	"recipehub/internal/api/deps"
	"recipehub/internal/api/dto"
	"recipehub/internal/api/httpx"
	"recipehub/internal/api/mapper"
	"recipehub/internal/infrastructure/database"
	"recipehub/internal/pkg/authctx"
)

type Handler struct{ Dep deps.Deps }

func New(d deps.Deps) *Handler { return &Handler{Dep: d} }

func (h *Handler) Save(w http.ResponseWriter, r *http.Request) {
	uid, ok := authctx.UserID(r.Context())
	if !ok {
		api.RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Требуется авторизация")
		return
	}
	id, ok := httpx.UintPath(r, "id")
	if !ok {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный id")
		return
	}
	if _, err := h.Dep.Store.RecipeByID(id); api.RespondFindError(w, err) {
		return
	}
	if err := h.Dep.Store.SaveRecipeForUser(uid, id); err != nil {
		if database.IsDuplicateKey(err) {
			api.RespondError(w, http.StatusConflict, "CONFLICT", "Рецепт уже сохранён")
			return
		}
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusCreated, map[string]any{
		"data": dto.Saved{Saved: true},
	})
}

func (h *Handler) Unsave(w http.ResponseWriter, r *http.Request) {
	uid, ok := authctx.UserID(r.Context())
	if !ok {
		api.RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Требуется авторизация")
		return
	}
	id, ok := httpx.UintPath(r, "id")
	if !ok {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный id")
		return
	}
	if _, err := h.Dep.Store.RecipeByID(id); api.RespondFindError(w, err) {
		return
	}
	if err := h.Dep.Store.UnsaveRecipeForUser(uid, id); err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{
		"data": dto.Saved{Saved: false},
	})
}

func (h *Handler) ListMe(w http.ResponseWriter, r *http.Request) {
	uid, ok := authctx.UserID(r.Context())
	if !ok {
		api.RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Требуется авторизация")
		return
	}
	limit, offset := httpx.ClampLimitOffset(r, 20)
	recipes, total, err := h.Dep.Store.ListSavedRecipes(uid, limit, offset)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	items := make([]dto.RecipeListItem, 0, len(recipes))
	for i := range recipes {
		items = append(items, mapper.RecipeListItem(h.Dep.Store, &recipes[i]))
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{
		"data": items,
		"pagination": dto.Pagination{
			Total: total, Limit: limit, Offset: offset,
		},
	})
}
