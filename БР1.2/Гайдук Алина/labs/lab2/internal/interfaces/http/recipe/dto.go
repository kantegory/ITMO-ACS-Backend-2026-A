package recipe

import (
	"time"

	recipedomain "recipehub/internal/domain/recipe"
)

type stepRequest struct {
	StepNumber  int     `json:"step_number"`
	Description string  `json:"description"`
	ImageURL    *string `json:"image_url"`
}

type ingredientRequest struct {
	IngredientID uint64   `json:"ingredient_id"`
	Quantity     *float64 `json:"quantity"`
	UnitID       *uint64  `json:"unit_id"`
	Note         *string  `json:"note"`
}

type createRecipeRequest struct {
	Title           string              `json:"title"`
	Description     *string             `json:"description"`
	CoverImageURL   *string             `json:"cover_image_url"`
	VideoURL        *string             `json:"video_url"`
	DishTypeID      *uint64             `json:"dish_type_id"`
	DifficultyID    *uint64             `json:"difficulty_id"`
	PrepTimeMinutes *int                `json:"prep_time_minutes"`
	CookTimeMinutes *int                `json:"cook_time_minutes"`
	Servings        *int                `json:"servings"`
	Steps           []stepRequest       `json:"steps"`
	Ingredients     []ingredientRequest `json:"ingredients"`
	TagIDs          []uint64            `json:"tag_ids"`
}

type patchRecipeRequest = createRecipeRequest

type userShortResponse struct {
	ID          uint64  `json:"id"`
	Username    string  `json:"username"`
	DisplayName string  `json:"display_name"`
	AvatarURL   *string `json:"avatar_url"`
}

type recipeResponse struct {
	ID              uint64               `json:"id"`
	Title           string               `json:"title"`
	Description     *string              `json:"description"`
	CoverImageURL   *string              `json:"cover_image_url"`
	VideoURL        *string              `json:"video_url,omitempty"`
	Author          userShortResponse    `json:"author"`
	DishTypeID      *uint64              `json:"dish_type_id"`
	DifficultyID    *uint64              `json:"difficulty_id"`
	PrepTimeMinutes *int                 `json:"prep_time_minutes"`
	CookTimeMinutes *int                 `json:"cook_time_minutes"`
	Servings        *int                 `json:"servings"`
	LikesCount      int64                `json:"likes_count"`
	CommentsCount   int64                `json:"comments_count"`
	IsLiked         bool                 `json:"is_liked,omitempty"`
	IsSaved         bool                 `json:"is_saved,omitempty"`
	Steps           []stepResponse       `json:"steps,omitempty"`
	Ingredients     []ingredientResponse `json:"ingredients,omitempty"`
	TagIDs          []uint64             `json:"tag_ids"`
	CreatedAt       time.Time            `json:"created_at"`
	UpdatedAt       time.Time            `json:"updated_at,omitempty"`
}

type stepResponse struct {
	ID          uint64  `json:"id"`
	StepNumber  int     `json:"step_number"`
	Description string  `json:"description"`
	ImageURL    *string `json:"image_url"`
}

type ingredientResponse struct {
	ID           uint64   `json:"id"`
	IngredientID uint64   `json:"ingredient_id"`
	Quantity     *float64 `json:"quantity"`
	UnitID       *uint64  `json:"unit_id"`
	Note         *string  `json:"note"`
}

type recipeBriefResponse struct {
	ID            uint64  `json:"id"`
	Title         string  `json:"title"`
	CoverImageURL *string `json:"cover_image_url"`
	AuthorID      uint64  `json:"author_id"`
}

type existsResponse struct {
	Exists bool `json:"exists"`
}

type countResponse struct {
	Count int64 `json:"count"`
}

func toDomainRecipe(req createRecipeRequest, authorID uint64) recipedomain.Recipe {
	steps := make([]recipedomain.Step, 0, len(req.Steps))
	for _, step := range req.Steps {
		steps = append(steps, recipedomain.Step{
			StepNumber:  step.StepNumber,
			Description: step.Description,
			ImageURL:    step.ImageURL,
		})
	}

	ingredients := make([]recipedomain.Ingredient, 0, len(req.Ingredients))
	for _, ingredient := range req.Ingredients {
		ingredients = append(ingredients, recipedomain.Ingredient{
			IngredientID: ingredient.IngredientID,
			Quantity:     ingredient.Quantity,
			UnitID:       ingredient.UnitID,
			Note:         ingredient.Note,
		})
	}

	return recipedomain.Recipe{
		AuthorID:        authorID,
		Title:           req.Title,
		Description:     req.Description,
		CoverImageURL:   req.CoverImageURL,
		VideoURL:        req.VideoURL,
		DishTypeID:      req.DishTypeID,
		DifficultyID:    req.DifficultyID,
		PrepTimeMinutes: req.PrepTimeMinutes,
		CookTimeMinutes: req.CookTimeMinutes,
		Servings:        req.Servings,
		Steps:           steps,
		Ingredients:     ingredients,
		TagIDs:          req.TagIDs,
	}
}

func toRecipeResponse(item recipedomain.RecipeWithAuthor, full bool) recipeResponse {
	recipe := item.Recipe
	out := recipeResponse{
		ID:              recipe.ID,
		Title:           recipe.Title,
		Description:     recipe.Description,
		CoverImageURL:   recipe.CoverImageURL,
		VideoURL:        recipe.VideoURL,
		Author:          toUserShortResponse(item.Author),
		DishTypeID:      recipe.DishTypeID,
		DifficultyID:    recipe.DifficultyID,
		PrepTimeMinutes: recipe.PrepTimeMinutes,
		CookTimeMinutes: recipe.CookTimeMinutes,
		Servings:        recipe.Servings,
		LikesCount:      item.Stats.LikesCount,
		CommentsCount:   item.Stats.CommentsCount,
		TagIDs:          recipe.TagIDs,
		CreatedAt:       recipe.CreatedAt,
		UpdatedAt:       recipe.UpdatedAt,
	}
	if !full {
		return out
	}

	out.Steps = make([]stepResponse, 0, len(recipe.Steps))
	for _, step := range recipe.Steps {
		out.Steps = append(out.Steps, stepResponse{
			ID:          step.ID,
			StepNumber:  step.StepNumber,
			Description: step.Description,
			ImageURL:    step.ImageURL,
		})
	}

	out.Ingredients = make([]ingredientResponse, 0, len(recipe.Ingredients))
	for _, ingredient := range recipe.Ingredients {
		out.Ingredients = append(out.Ingredients, ingredientResponse{
			ID:           ingredient.ID,
			IngredientID: ingredient.IngredientID,
			Quantity:     ingredient.Quantity,
			UnitID:       ingredient.UnitID,
			Note:         ingredient.Note,
		})
	}

	return out
}

func toUserShortResponse(author recipedomain.AuthorPreview) userShortResponse {
	return userShortResponse{
		ID:          author.ID,
		Username:    author.Username,
		DisplayName: author.DisplayName,
		AvatarURL:   author.AvatarURL,
	}
}

func toBriefResponse(recipe recipedomain.Recipe) recipeBriefResponse {
	return recipeBriefResponse{
		ID:            recipe.ID,
		Title:         recipe.Title,
		CoverImageURL: recipe.CoverImageURL,
		AuthorID:      recipe.AuthorID,
	}
}
