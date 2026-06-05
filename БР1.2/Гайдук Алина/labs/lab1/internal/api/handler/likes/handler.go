package likes

import (
	"net/http"

	"recipehub/internal/api"
	"recipehub/internal/api/deps"
	"recipehub/internal/api/dto"
	"recipehub/internal/api/httpx"
	"recipehub/internal/infrastructure/database"
	"recipehub/internal/pkg/authctx"
)

type Handler struct{ Dep deps.Deps }

func New(d deps.Deps) *Handler { return &Handler{Dep: d} }

func (h *Handler) RecipeLike(w http.ResponseWriter, r *http.Request) {
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
	if err := h.Dep.Store.RecipeLike(uid, id); err != nil {
		if database.IsDuplicateKey(err) {
			api.RespondError(w, http.StatusConflict, "CONFLICT", "Вы уже поставили лайк этому рецепту")
			return
		}
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusCreated, map[string]any{
		"data": dto.Liked{Liked: true, LikesCount: h.Dep.Store.RecipeLikesCount(id)},
	})
}

func (h *Handler) RecipeUnlike(w http.ResponseWriter, r *http.Request) {
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
	if err := h.Dep.Store.RecipeUnlike(uid, id); err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{
		"data": dto.Liked{Liked: false, LikesCount: h.Dep.Store.RecipeLikesCount(id)},
	})
}

func (h *Handler) PostLike(w http.ResponseWriter, r *http.Request) {
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
	if _, err := h.Dep.Store.PostByID(id); api.RespondFindError(w, err) {
		return
	}
	if err := h.Dep.Store.PostLike(uid, id); err != nil {
		if database.IsDuplicateKey(err) {
			api.RespondError(w, http.StatusConflict, "CONFLICT", "Вы уже поставили лайк этому посту")
			return
		}
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusCreated, map[string]any{
		"data": dto.Liked{Liked: true, LikesCount: h.Dep.Store.PostLikesCount(id)},
	})
}

func (h *Handler) PostUnlike(w http.ResponseWriter, r *http.Request) {
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
	if _, err := h.Dep.Store.PostByID(id); api.RespondFindError(w, err) {
		return
	}
	if err := h.Dep.Store.PostUnlike(uid, id); err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{
		"data": dto.Liked{Liked: false, LikesCount: h.Dep.Store.PostLikesCount(id)},
	})
}
