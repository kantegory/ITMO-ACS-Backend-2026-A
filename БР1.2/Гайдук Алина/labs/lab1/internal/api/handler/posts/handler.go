package posts

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
	"recipehub/internal/infrastructure/database/model"
	"recipehub/internal/pkg/authctx"
)

type Handler struct{ Dep deps.Deps }

func New(d deps.Deps) *Handler { return &Handler{Dep: d} }

type createBody struct {
	Title         string  `json:"title"`
	Content       string  `json:"content"`
	CoverImageURL *string `json:"cover_image_url"`
}

type patchBody struct {
	Title         *string `json:"title"`
	Content       *string `json:"content"`
	CoverImageURL *string `json:"cover_image_url"`
}

func viewerPtr(ok bool, id uint64) *uint64 {
	if !ok {
		return nil
	}
	v := id
	return &v
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	limit, offset := httpx.ClampLimitOffset(r, 20)
	page, err := h.Dep.Store.ListPosts(limit, offset)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	items := make([]dto.PostListItem, 0, len(page.Posts))
	for i := range page.Posts {
		items = append(items, mapper.PostListItem(h.Dep.Store, &page.Posts[i]))
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{
		"data": items,
		"pagination": dto.Pagination{
			Total: page.Total, Limit: limit, Offset: offset,
		},
	})
}

func (h *Handler) Post(w http.ResponseWriter, r *http.Request) {
	uid, ok := authctx.UserID(r.Context())
	if !ok {
		api.RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Требуется авторизация")
		return
	}
	var body createBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный формат JSON")
		return
	}
	body.Title = strings.TrimSpace(body.Title)
	body.Content = strings.TrimSpace(body.Content)
	if body.Title == "" || len(body.Title) > 255 || body.Content == "" {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "title/content обязательны")
		return
	}
	p := &model.Post{
		AuthorID:      uid,
		Title:         body.Title,
		Content:       body.Content,
		CoverImageURL: body.CoverImageURL,
	}
	if err := h.Dep.Store.CreatePost(p); err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	got, err := h.Dep.Store.PostByID(p.ID)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusCreated, map[string]any{"data": mapper.PostFull(h.Dep.Store, got, &uid)})
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, ok := httpx.UintPath(r, "id")
	if !ok {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный id")
		return
	}
	got, err := h.Dep.Store.PostByID(id)
	if err != nil {
		postNotFound(w, err)
		return
	}
	ctxID, ctxOK := authctx.UserID(r.Context())
	api.RespondJSON(w, http.StatusOK, map[string]any{"data": mapper.PostFull(h.Dep.Store, got, viewerPtr(ctxOK, ctxID))})
}

func (h *Handler) Patch(w http.ResponseWriter, r *http.Request) {
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
	got, err := h.Dep.Store.PostByID(id)
	if err != nil {
		postNotFound(w, err)
		return
	}
	if got.AuthorID != uid {
		api.RespondError(w, http.StatusForbidden, "FORBIDDEN", "Нет прав на выполнение действия")
		return
	}
	var body patchBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный формат JSON")
		return
	}
	if body.Title != nil {
		t := strings.TrimSpace(*body.Title)
		if t == "" || len(t) > 255 {
			api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "title невалиден")
			return
		}
		got.Title = t
	}
	if body.Content != nil {
		c := strings.TrimSpace(*body.Content)
		if c == "" {
			api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "content не может быть пустым")
			return
		}
		got.Content = c
	}
	if body.CoverImageURL != nil {
		got.CoverImageURL = body.CoverImageURL
	}
	if err := h.Dep.Store.SavePost(got); err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	refreshed, err := h.Dep.Store.PostByID(id)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{"data": mapper.PostFull(h.Dep.Store, refreshed, &uid)})
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
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
	got, err := h.Dep.Store.PostByID(id)
	if err != nil {
		postNotFound(w, err)
		return
	}
	if got.AuthorID != uid {
		api.RespondError(w, http.StatusForbidden, "FORBIDDEN", "Нет прав на выполнение действия")
		return
	}
	if err := h.Dep.Store.DeletePost(id); err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func postNotFound(w http.ResponseWriter, err error) {
	if database.IsRecordNotFound(err) {
		api.RespondError(w, http.StatusNotFound, "NOT_FOUND", "Сущность не найдена")
		return
	}
	api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
}
