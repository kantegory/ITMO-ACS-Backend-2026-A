package users

import (
	"encoding/json"
	"net/http"
	"strings"

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

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, ok := httpx.UintPath(r, "id")
	if !ok {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный id")
		return
	}
	u, err := h.Dep.Store.UserByID(id)
	if err != nil {
		notFound(w, err)
		return
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{"data": mapper.UserProfile(h.Dep.Store, u)})
}

type PatchMeBody struct {
	DisplayName *string `json:"display_name"`
	Bio         *string `json:"bio"`
	AvatarURL   *string `json:"avatar_url"`
}

func (h *Handler) PatchMe(w http.ResponseWriter, r *http.Request) {
	id, ok := authctx.UserID(r.Context())
	if !ok {
		api.RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Требуется авторизация")
		return
	}
	var body PatchMeBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный формат JSON")
		return
	}
	u, err := h.Dep.Store.UserByID(id)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	if body.DisplayName != nil {
		dn := strings.TrimSpace(*body.DisplayName)
		if dn == "" {
			api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "display_name не может быть пустым")
			return
		}
		if len(dn) > 100 {
			api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "display_name слишком длинный")
			return
		}
		u.DisplayName = dn
	}
	if body.Bio != nil {
		u.Bio = body.Bio
	}
	if body.AvatarURL != nil {
		u.AvatarURL = body.AvatarURL
	}
	if err := h.Dep.Store.UpdateUser(&u); err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{"data": mapper.UserProfile(h.Dep.Store, u)})
}

func (h *Handler) ListRecipes(w http.ResponseWriter, r *http.Request) {
	id, ok := httpx.UintPath(r, "id")
	if !ok {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный id")
		return
	}
	if _, err := h.Dep.Store.UserByID(id); err != nil {
		notFound(w, err)
		return
	}
	limit, offset := httpx.ClampLimitOffset(r, 20)
	page, err := h.Dep.Store.ListRecipes(database.RecipeFilters{AuthorID: &id, Limit: limit, Offset: offset})
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	items := make([]dto.RecipeListItem, 0, len(page.Recipes))
	for i := range page.Recipes {
		items = append(items, mapper.RecipeListItem(h.Dep.Store, &page.Recipes[i]))
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{"data": items, "pagination": dto.Pagination{Total: page.Total, Limit: limit, Offset: offset}})
}

func (h *Handler) ListPosts(w http.ResponseWriter, r *http.Request) {
	id, ok := httpx.UintPath(r, "id")
	if !ok {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный id")
		return
	}
	if _, err := h.Dep.Store.UserByID(id); err != nil {
		notFound(w, err)
		return
	}
	limit, offset := httpx.ClampLimitOffset(r, 20)
	page, err := h.Dep.Store.ListPostsByAuthor(id, limit, offset)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	posts := page.Posts
	items := make([]dto.PostListItem, 0, len(posts))
	for i := range posts {
		items = append(items, mapper.PostListItem(h.Dep.Store, &posts[i]))
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{"data": items, "pagination": dto.Pagination{Total: page.Total, Limit: limit, Offset: offset}})
}

func (h *Handler) ListFollowers(w http.ResponseWriter, r *http.Request) {
	id, ok := httpx.UintPath(r, "id")
	if !ok {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный id")
		return
	}
	if _, err := h.Dep.Store.UserByID(id); err != nil {
		notFound(w, err)
		return
	}
	limit, offset := httpx.ClampLimitOffset(r, 20)
	rows, total, err := h.Dep.Store.ListFollowers(id, limit, offset)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	ids := make([]uint64, len(rows))
	for i, f := range rows {
		ids[i] = f.FollowerID
	}
	users, err := h.Dep.Store.UsersByIDsInOrder(ids)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	out := make([]dto.FollowUser, len(users))
	for i := range users {
		out[i] = mapper.FollowUserDTO(users[i], rows[i].CreatedAt)
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{"data": out, "pagination": dto.Pagination{Total: total, Limit: limit, Offset: offset}})
}

func (h *Handler) ListFollowing(w http.ResponseWriter, r *http.Request) {
	id, ok := httpx.UintPath(r, "id")
	if !ok {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный id")
		return
	}
	if _, err := h.Dep.Store.UserByID(id); err != nil {
		notFound(w, err)
		return
	}
	limit, offset := httpx.ClampLimitOffset(r, 20)
	rows, total, err := h.Dep.Store.ListFollowing(id, limit, offset)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	ids := make([]uint64, len(rows))
	for i, f := range rows {
		ids[i] = f.FollowingID
	}
	users, err := h.Dep.Store.UsersByIDsInOrder(ids)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	out := make([]dto.FollowUser, len(users))
	for i := range users {
		out[i] = mapper.FollowUserDTO(users[i], rows[i].CreatedAt)
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{"data": out, "pagination": dto.Pagination{Total: total, Limit: limit, Offset: offset}})
}

func (h *Handler) Follow(w http.ResponseWriter, r *http.Request) {
	me, ok := authctx.UserID(r.Context())
	if !ok {
		api.RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Требуется авторизация")
		return
	}
	id, ok := httpx.UintPath(r, "id")
	if !ok {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный id")
		return
	}
	if me == id {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Нельзя подписаться на самого себя")
		return
	}
	if _, err := h.Dep.Store.UserByID(id); err != nil {
		notFound(w, err)
		return
	}
	if h.Dep.Store.IsFollow(me, id) {
		api.RespondError(w, http.StatusConflict, "CONFLICT", "Вы уже подписаны на этого пользователя")
		return
	}
	if err := h.Dep.Store.FollowUser(me, id); err != nil {
		if database.IsDuplicateKey(err) {
			api.RespondError(w, http.StatusConflict, "CONFLICT", "Вы уже подписаны на этого пользователя")
			return
		}
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusCreated, map[string]any{"data": dto.Following{Following: true}})
}

func (h *Handler) Unfollow(w http.ResponseWriter, r *http.Request) {
	me, ok := authctx.UserID(r.Context())
	if !ok {
		api.RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Требуется авторизация")
		return
	}
	id, ok := httpx.UintPath(r, "id")
	if !ok {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный id")
		return
	}
	if _, err := h.Dep.Store.UserByID(id); err != nil {
		notFound(w, err)
		return
	}
	if err := h.Dep.Store.UnfollowUser(me, id); err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{"data": dto.Following{Following: false}})
}

func notFound(w http.ResponseWriter, err error) {
	if database.IsRecordNotFound(err) {
		api.RespondError(w, http.StatusNotFound, "NOT_FOUND", "Сущность не найдена")
		return
	}
	api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
}
