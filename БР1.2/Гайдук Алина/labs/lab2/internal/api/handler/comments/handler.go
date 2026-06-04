package comments

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

type createCommentBody struct {
	Content         string  `json:"content"`
	ParentCommentID *uint64 `json:"parent_comment_id"`
}

func (h *Handler) ListForRecipe(w http.ResponseWriter, r *http.Request) {
	id, ok := httpx.UintPath(r, "id")
	if !ok {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный id")
		return
	}
	if !h.Dep.Store.RecipeExists(id) {
		api.RespondError(w, http.StatusNotFound, "NOT_FOUND", "Сущность не найдена")
		return
	}
	limit, offset := httpx.ClampLimitOffset(r, 20)
	roots, total, err := h.Dep.Store.CommentsForRecipePaged(id, limit, offset)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	rootIDs := make([]uint64, 0, len(roots))
	for _, rr := range roots {
		rootIDs = append(rootIDs, rr.ID)
	}
	descendants, err := h.Dep.Store.CommentDescendantsUnderRootsForRecipe(id, rootIDs)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	items := mapper.CommentForest(roots, descendants)
	api.RespondJSON(w, http.StatusOK, map[string]any{
		"data":       items,
		"pagination": dto.Pagination{Total: total, Limit: limit, Offset: offset},
	})
}

func (h *Handler) PostForRecipe(w http.ResponseWriter, r *http.Request) {
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
	if !h.Dep.Store.RecipeExists(id) {
		api.RespondError(w, http.StatusNotFound, "NOT_FOUND", "Сущность не найдена")
		return
	}
	var body createCommentBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный формат JSON")
		return
	}
	body.Content = strings.TrimSpace(body.Content)
	if body.Content == "" {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "comment обязателен")
		return
	}
	if body.ParentCommentID != nil {
		parent, err := h.Dep.Store.CommentByID(*body.ParentCommentID)
		if err != nil || parent.RecipeID == nil || *parent.RecipeID != id || parent.PostID != nil {
			api.RespondError(w, http.StatusNotFound, "NOT_FOUND", "Сущность не найдена")
			return
		}
	}
	cm := model.Comment{
		AuthorID:        uid,
		RecipeID:        &id,
		ParentCommentID: body.ParentCommentID,
		Content:         body.Content,
	}
	if err := h.Dep.Store.CreateComment(&cm); err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	cm, err := h.Dep.Store.ReloadCommentWithAuthor(cm.ID)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusCreated, map[string]any{
		"data": mapper.CommentThread(cm, nil),
	})
}

func (h *Handler) ListForPost(w http.ResponseWriter, r *http.Request) {
	id, ok := httpx.UintPath(r, "id")
	if !ok {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный id")
		return
	}
	if !h.Dep.Store.PostExists(id) {
		api.RespondError(w, http.StatusNotFound, "NOT_FOUND", "Сущность не найдена")
		return
	}
	limit, offset := httpx.ClampLimitOffset(r, 20)
	roots, total, err := h.Dep.Store.CommentsForPostPaged(id, limit, offset)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	rootIDs := make([]uint64, 0, len(roots))
	for _, rr := range roots {
		rootIDs = append(rootIDs, rr.ID)
	}
	descendants, err := h.Dep.Store.CommentDescendantsUnderRootsForPost(id, rootIDs)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	items := mapper.CommentForest(roots, descendants)
	api.RespondJSON(w, http.StatusOK, map[string]any{
		"data":       items,
		"pagination": dto.Pagination{Total: total, Limit: limit, Offset: offset},
	})
}

func (h *Handler) PostForPost(w http.ResponseWriter, r *http.Request) {
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
	if !h.Dep.Store.PostExists(id) {
		api.RespondError(w, http.StatusNotFound, "NOT_FOUND", "Сущность не найдена")
		return
	}
	var body createCommentBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный формат JSON")
		return
	}
	body.Content = strings.TrimSpace(body.Content)
	if body.Content == "" {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "comment обязателен")
		return
	}
	if body.ParentCommentID != nil {
		parent, err := h.Dep.Store.CommentByID(*body.ParentCommentID)
		if err != nil || parent.PostID == nil || *parent.PostID != id || parent.RecipeID != nil {
			api.RespondError(w, http.StatusNotFound, "NOT_FOUND", "Сущность не найдена")
			return
		}
	}
	cm := model.Comment{
		AuthorID:        uid,
		PostID:          &id,
		ParentCommentID: body.ParentCommentID,
		Content:         body.Content,
	}
	if err := h.Dep.Store.CreateComment(&cm); err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	cm, err := h.Dep.Store.ReloadCommentWithAuthor(cm.ID)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusCreated, map[string]any{
		"data": mapper.CommentThread(cm, nil),
	})
}

func (h *Handler) DeleteByID(w http.ResponseWriter, r *http.Request) {
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
	cm, err := h.Dep.Store.CommentByID(id)
	if err != nil {
		if database.IsRecordNotFound(err) {
			api.RespondError(w, http.StatusNotFound, "NOT_FOUND", "Сущность не найдена")
			return
		}
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	if cm.AuthorID != uid {
		api.RespondError(w, http.StatusForbidden, "FORBIDDEN", "Нет прав на выполнение действия")
		return
	}
	if err := h.Dep.Store.DeleteCommentSubtree(id); err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
