// Package recipe contains recipe domain types.
package recipe

import "time"

// AuthorPreview is the author data needed by recipe responses.
type AuthorPreview struct {
	ID          uint64
	Username    string
	DisplayName string
	AvatarURL   *string
}

// Recipe describes a recipe aggregate root.
type Recipe struct {
	ID              uint64
	AuthorID        uint64
	Title           string
	Description     *string
	CoverImageURL   *string
	VideoURL        *string
	DishTypeID      *uint64
	DifficultyID    *uint64
	PrepTimeMinutes *int
	CookTimeMinutes *int
	Servings        *int
	Steps           []Step
	Ingredients     []Ingredient
	TagIDs          []uint64
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// Step describes a recipe preparation step.
type Step struct {
	ID          uint64
	StepNumber  int
	Description string
	ImageURL    *string
}

// Ingredient describes an ingredient reference inside a recipe.
type Ingredient struct {
	ID           uint64
	IngredientID uint64
	Quantity     *float64
	UnitID       *uint64
	Note         *string
}

// RecipeWithAuthor combines a recipe and author preview.
type RecipeWithAuthor struct {
	Recipe Recipe
	Author AuthorPreview
}

// Filters contains recipe list filters.
type Filters struct {
	AuthorID      *uint64
	Search        string
	DishTypeID    *uint64
	DifficultyID  *uint64
	IngredientIDs []uint64
	TagIDs        []uint64
	Limit         int
	Offset        int
}

// Page describes paginated recipe results.
type Page[T any] struct {
	Items []T
	Total int64
}
