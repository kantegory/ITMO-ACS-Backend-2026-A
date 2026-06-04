package recipes

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
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

type RecipeStepReq struct {
	StepNumber  int     `json:"step_number"`
	Description string  `json:"description"`
	ImageURL    *string `json:"image_url"`
}

type RecipeIngredientReq struct {
	IngredientID uint64   `json:"ingredient_id"`
	Quantity     *float64 `json:"quantity"`
	UnitID       *uint64  `json:"unit_id"`
	Note         *string  `json:"note"`
}

type CreateRecipeBody struct {
	Title           string                `json:"title"`
	Description     *string               `json:"description"`
	CoverImageURL   *string               `json:"cover_image_url"`
	VideoURL        *string               `json:"video_url"`
	DishTypeID      *uint64               `json:"dish_type_id"`
	DifficultyID    *uint64               `json:"difficulty_id"`
	PrepTimeMinutes *int                  `json:"prep_time_minutes"`
	CookTimeMinutes *int                  `json:"cook_time_minutes"`
	Servings        *int                  `json:"servings"`
	Steps           []RecipeStepReq       `json:"steps"`
	Ingredients     []RecipeIngredientReq `json:"ingredients"`
	TagIDs          []uint64              `json:"tag_ids"`
}

type PatchRecipeBody struct {
	Title           *string                `json:"title"`
	Description     *string                `json:"description"`
	CoverImageURL   *string                `json:"cover_image_url"`
	VideoURL        *string                `json:"video_url"`
	DishTypeID      *uint64                `json:"dish_type_id"`
	DifficultyID    *uint64                `json:"difficulty_id"`
	PrepTimeMinutes *int                   `json:"prep_time_minutes"`
	CookTimeMinutes *int                   `json:"cook_time_minutes"`
	Servings        *int                   `json:"servings"`
	Steps           *[]RecipeStepReq       `json:"steps"`
	Ingredients     *[]RecipeIngredientReq `json:"ingredients"`
	TagIDs          *[]uint64              `json:"tag_ids"`
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit, offset := httpx.ClampLimitOffset(r, 20)
	f := database.RecipeFilters{Limit: limit, Offset: offset}

	if v := strings.TrimSpace(q.Get("search")); v != "" {
		f.Search = v
	}
	if v := strings.TrimSpace(q.Get("dish_type_id")); v != "" {
		if id, err := strconv.ParseUint(v, 10, 64); err != nil {
			api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный dish_type_id")
			return
		} else if id != 0 {
			f.DishTypeID = &id
		}
	}
	if v := strings.TrimSpace(q.Get("difficulty_id")); v != "" {
		if id, err := strconv.ParseUint(v, 10, 64); err != nil {
			api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный difficulty_id")
			return
		} else if id != 0 {
			f.DifficultyID = &id
		}
	}
	if raw := strings.TrimSpace(q.Get("ingredient_ids")); raw != "" {
		ids, err := httpx.ParseCommaUintsStrict(raw)
		if err != nil {
			api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный ingredient_ids")
			return
		}
		f.IngredientIDs = ids
	}
	if raw := strings.TrimSpace(q.Get("tag_ids")); raw != "" {
		ids, err := httpx.ParseCommaUintsStrict(raw)
		if err != nil {
			api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный tag_ids")
			return
		}
		f.TagIDs = ids
	}

	page, err := h.Dep.Store.ListRecipes(f)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	items := make([]dto.RecipeListItem, 0, len(page.Recipes))
	for i := range page.Recipes {
		items = append(items, mapper.RecipeListItem(h.Dep.Store, &page.Recipes[i]))
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
	var body CreateRecipeBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный формат JSON")
		return
	}
	body.Title = strings.TrimSpace(body.Title)
	if body.Title == "" || len(body.Title) > 255 {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "title обязателен", "title: обязательное поле")
		return
	}
	if !recipeNutritionValid(w, body.PrepTimeMinutes, body.CookTimeMinutes, body.Servings) {
		return
	}
	if !recipeRefsValid(w, h.Dep.Store, body.DishTypeID, body.DifficultyID) {
		return
	}
	for _, ing := range body.Ingredients {
		if !h.Dep.Store.IngredientExists(ing.IngredientID) {
			api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Неизвестный ингредиент")
			return
		}
		if ing.UnitID != nil && *ing.UnitID != 0 && !h.Dep.Store.MeasurementUnitExists(*ing.UnitID) {
			api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Неизвестная единица измерения")
			return
		}
	}
	if !recipeStepsValid(body.Steps) {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Проверьте шаги", "steps: step_number >= 1 и description обязательны")
		return
	}

	steps := make([]model.RecipeStep, 0, len(body.Steps))
	for _, s := range body.Steps {
		steps = append(steps, model.RecipeStep{
			StepNumber:  s.StepNumber,
			Description: s.Description,
			ImageURL:    s.ImageURL,
		})
	}
	ings := make([]model.RecipeIngredient, 0, len(body.Ingredients))
	for _, x := range body.Ingredients {
		ings = append(ings, model.RecipeIngredient{
			IngredientID: x.IngredientID,
			Quantity:     x.Quantity,
			UnitID:       x.UnitID,
			Note:         x.Note,
		})
	}
	tagIDs := httpx.DedupPreserveOrderUints(body.TagIDs)
	tags, err := h.Dep.Store.ResolveTags(tagIDs)
	if errors.Is(err, database.ErrUnknownTagIDs) {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Неизвестные теги")
		return
	}
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	base := model.Recipe{
		AuthorID:        uid,
		Title:           body.Title,
		Description:     body.Description,
		CoverImageURL:   body.CoverImageURL,
		VideoURL:        body.VideoURL,
		DishTypeID:      body.DishTypeID,
		DifficultyID:    body.DifficultyID,
		PrepTimeMinutes: body.PrepTimeMinutes,
		CookTimeMinutes: body.CookTimeMinutes,
		Servings:        body.Servings,
	}
	mustID, err := h.Dep.Store.CreateRecipeFull(base, steps, ings, tags)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	full, err := h.Dep.Store.RecipeByID(mustID)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusCreated, map[string]any{"data": mapper.RecipeFull(h.Dep.Store, full, &uid)})
}

func viewerPtr(ctxUser uint64, ok bool) *uint64 {
	if !ok {
		return nil
	}
	v := ctxUser
	return &v
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, ok := httpx.UintPath(r, "id")
	if !ok {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный id")
		return
	}
	rec, err := h.Dep.Store.RecipeByID(id)
	if err != nil {
		notFoundRecipe(w, err)
		return
	}
	ctxID, ctxOK := authctx.UserID(r.Context())
	api.RespondJSON(w, http.StatusOK, map[string]any{"data": mapper.RecipeFull(h.Dep.Store, rec, viewerPtr(ctxID, ctxOK))})
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
	rec, err := h.Dep.Store.RecipeByID(id)
	if err != nil {
		notFoundRecipe(w, err)
		return
	}
	if rec.AuthorID != uid {
		api.RespondError(w, http.StatusForbidden, "FORBIDDEN", "Нет прав на выполнение действия")
		return
	}
	var body PatchRecipeBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный формат JSON")
		return
	}
	if body.Title != nil {
		if strings.TrimSpace(*body.Title) == "" || len(*body.Title) > 255 {
			api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "title невалиден")
			return
		}
		rec.Title = *body.Title
	}
	if body.Description != nil {
		rec.Description = body.Description
	}
	if body.CoverImageURL != nil {
		rec.CoverImageURL = body.CoverImageURL
	}
	if body.VideoURL != nil {
		rec.VideoURL = body.VideoURL
	}
	if body.DishTypeID != nil {
		rec.DishTypeID = body.DishTypeID
	}
	if body.DifficultyID != nil {
		rec.DifficultyID = body.DifficultyID
	}
	if body.PrepTimeMinutes != nil {
		rec.PrepTimeMinutes = body.PrepTimeMinutes
	}
	if body.CookTimeMinutes != nil {
		rec.CookTimeMinutes = body.CookTimeMinutes
	}
	if body.Servings != nil {
		rec.Servings = body.Servings
	}
	if !recipeNutritionValid(w, rec.PrepTimeMinutes, rec.CookTimeMinutes, rec.Servings) {
		return
	}
	if !recipeRefsValid(w, h.Dep.Store, rec.DishTypeID, rec.DifficultyID) {
		return
	}
	if err := h.Dep.Store.SaveRecipe(rec); err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}

	if body.Steps == nil && body.Ingredients == nil && body.TagIDs == nil {
		refreshed, err := h.Dep.Store.RecipeByID(id)
		if err != nil {
			api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
			return
		}
		api.RespondJSON(w, http.StatusOK, map[string]any{"data": mapper.RecipeFull(h.Dep.Store, refreshed, &uid)})
		return
	}

	fresh, err := h.Dep.Store.RecipeByID(id)
	if err != nil {
		notFoundRecipe(w, err)
		return
	}
	steps := fresh.Steps
	if body.Steps != nil {
		if !recipeStepsValid(*body.Steps) {
			api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Проверьте шаги")
			return
		}
		steps = make([]model.RecipeStep, 0, len(*body.Steps))
		for _, s := range *body.Steps {
			steps = append(steps, model.RecipeStep{
				StepNumber:  s.StepNumber,
				Description: s.Description,
				ImageURL:    s.ImageURL,
			})
		}
	}
	ings := fresh.Ingredients
	if body.Ingredients != nil {
		for _, x := range *body.Ingredients {
			if !h.Dep.Store.IngredientExists(x.IngredientID) {
				api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Неизвестный ингредиент")
				return
			}
			if x.UnitID != nil && *x.UnitID != 0 && !h.Dep.Store.MeasurementUnitExists(*x.UnitID) {
				api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Неизвестная единица измерения")
				return
			}
		}
		ings = make([]model.RecipeIngredient, 0, len(*body.Ingredients))
		for _, x := range *body.Ingredients {
			ings = append(ings, model.RecipeIngredient{
				IngredientID: x.IngredientID,
				Quantity:     x.Quantity,
				UnitID:       x.UnitID,
				Note:         x.Note,
			})
		}
	}
	var tags []model.Tag
	if body.TagIDs != nil {
		tagIDs := httpx.DedupPreserveOrderUints(*body.TagIDs)
		tags, err = h.Dep.Store.ResolveTags(tagIDs)
		if errors.Is(err, database.ErrUnknownTagIDs) {
			api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Неизвестные теги")
			return
		}
		if err != nil {
			api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
			return
		}
	} else if err := h.Dep.Store.DB.Model(fresh).Association("Tags").Find(&tags); err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}

	if body.Steps != nil || body.Ingredients != nil || body.TagIDs != nil {
		if err := h.Dep.Store.ReplaceRecipeAssociations(id, steps, ings, tags); err != nil {
			api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
			return
		}
	}

	refreshed, err := h.Dep.Store.RecipeByID(id)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{"data": mapper.RecipeFull(h.Dep.Store, refreshed, &uid)})
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
	rec, err := h.Dep.Store.RecipeByID(id)
	if err != nil {
		notFoundRecipe(w, err)
		return
	}
	if rec.AuthorID != uid {
		api.RespondError(w, http.StatusForbidden, "FORBIDDEN", "Нет прав на выполнение действия")
		return
	}
	if err := h.Dep.Store.DeleteRecipe(id); err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func notFoundRecipe(w http.ResponseWriter, err error) {
	if database.IsRecordNotFound(err) {
		api.RespondError(w, http.StatusNotFound, "NOT_FOUND", "Сущность не найдена")
		return
	}
	api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
}

func recipeStepsValid(steps []RecipeStepReq) bool {
	for _, s := range steps {
		if s.StepNumber < 1 || strings.TrimSpace(s.Description) == "" {
			return false
		}
	}
	return true
}

func recipeNutritionValid(w http.ResponseWriter, prep, cook, servings *int) bool {
	if prep != nil && *prep < 0 {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "prep_time_minutes не может быть отрицательным")
		return false
	}
	if cook != nil && *cook < 0 {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "cook_time_minutes не может быть отрицательным")
		return false
	}
	if servings != nil && *servings < 1 {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "servings должно быть не менее 1")
		return false
	}
	return true
}

func recipeRefsValid(w http.ResponseWriter, st *database.Store, dishTypeID, difficultyID *uint64) bool {
	if dishTypeID != nil && *dishTypeID != 0 && !st.DishTypeExists(*dishTypeID) {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Неизвестный тип блюда")
		return false
	}
	if difficultyID != nil && *difficultyID != 0 && !st.DifficultyExists(*difficultyID) {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Неизвестная сложность")
		return false
	}
	return true
}
