package refs

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"recipehub/internal/api"
	"recipehub/internal/api/deps"
	"recipehub/internal/api/dto"
	"recipehub/internal/infrastructure/database"
)

type Handler struct{ Dep deps.Deps }

func New(d deps.Deps) *Handler { return &Handler{Dep: d} }

type referenceNameBody struct {
	Name string `json:"name"`
}

func (h *Handler) PostDishType(w http.ResponseWriter, r *http.Request) {
	var body referenceNameBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный формат JSON")
		return
	}
	name := strings.TrimSpace(body.Name)
	if name == "" || len(name) > 100 {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "name: от 1 до 100 символов")
		return
	}
	if h.Dep.Store.DishTypeExistsName(name) {
		api.RespondError(w, http.StatusConflict, "CONFLICT", "Такой тип блюда уже существует")
		return
	}
	row, err := h.Dep.Store.CreateDishType(name)
	if err != nil {
		if database.IsDuplicateKey(err) {
			api.RespondError(w, http.StatusConflict, "CONFLICT", "Такой тип блюда уже существует")
			return
		}
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusCreated, map[string]any{"data": dto.DishType{ID: row.ID, Name: row.Name}})
}

func (h *Handler) PostTag(w http.ResponseWriter, r *http.Request) {
	var body referenceNameBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный формат JSON")
		return
	}
	name := strings.TrimSpace(body.Name)
	if name == "" || len(name) > 100 {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "name: от 1 до 100 символов")
		return
	}
	if h.Dep.Store.TagExistsName(name) {
		api.RespondError(w, http.StatusConflict, "CONFLICT", "Такой тег уже существует")
		return
	}
	row, err := h.Dep.Store.CreateTag(name)
	if err != nil {
		if database.IsDuplicateKey(err) {
			api.RespondError(w, http.StatusConflict, "CONFLICT", "Такой тег уже существует")
			return
		}
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusCreated, map[string]any{"data": dto.Tag{ID: row.ID, Name: row.Name}})
}

func (h *Handler) PostIngredient(w http.ResponseWriter, r *http.Request) {
	var body referenceNameBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный формат JSON")
		return
	}
	name := strings.TrimSpace(body.Name)
	if name == "" || len(name) > 200 {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "name: от 1 до 200 символов")
		return
	}
	if h.Dep.Store.IngredientExistsName(name) {
		api.RespondError(w, http.StatusConflict, "CONFLICT", "Такой ингредиент уже существует")
		return
	}
	row, err := h.Dep.Store.CreateIngredient(name)
	if err != nil {
		if database.IsDuplicateKey(err) {
			api.RespondError(w, http.StatusConflict, "CONFLICT", "Такой ингредиент уже существует")
			return
		}
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusCreated, map[string]any{"data": dto.IngredientRef{ID: row.ID, Name: row.Name}})
}

func (h *Handler) DishTypes(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Dep.Store.DishTypes()
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	out := make([]dto.DishType, 0, len(rows))
	for _, x := range rows {
		out = append(out, dto.DishType{ID: x.ID, Name: x.Name})
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{"data": out})
}

func (h *Handler) Difficulties(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Dep.Store.Difficulties()
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	out := make([]dto.Difficulty, 0, len(rows))
	for _, x := range rows {
		out = append(out, dto.Difficulty{ID: x.ID, Name: x.Name})
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{"data": out})
}

func (h *Handler) Tags(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Dep.Store.Tags()
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	out := make([]dto.Tag, 0, len(rows))
	for _, x := range rows {
		out = append(out, dto.Tag{ID: x.ID, Name: x.Name})
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{"data": out})
}

func (h *Handler) Ingredients(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	limit := 20
	if v := r.URL.Query().Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			limit = n
			if limit < 1 {
				limit = 1
			}
			if limit > 100 {
				limit = 100
			}
		}
	}
	rows, err := h.Dep.Store.SearchIngredients(q, limit)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	out := make([]dto.IngredientRef, 0, len(rows))
	for _, x := range rows {
		out = append(out, dto.IngredientRef{ID: x.ID, Name: x.Name})
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{"data": out})
}
