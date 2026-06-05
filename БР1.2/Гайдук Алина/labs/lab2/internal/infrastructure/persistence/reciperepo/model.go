package reciperepo

import "time"

type recipeRow struct {
	ID              uint64 `gorm:"primaryKey"`
	AuthorID        uint64 `gorm:"index;not null"`
	Title           string `gorm:"not null;size:255;index"`
	Description     *string
	CoverImageURL   *string `gorm:"size:512"`
	VideoURL        *string `gorm:"size:512"`
	DishTypeID      *uint64
	DifficultyID    *uint64
	PrepTimeMinutes *int
	CookTimeMinutes *int
	Servings        *int
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

func (recipeRow) TableName() string {
	return recipesTable
}

type stepRow struct {
	ID          uint64  `gorm:"primaryKey"`
	RecipeID    uint64  `gorm:"index;not null"`
	StepNumber  int     `gorm:"not null"`
	Description string  `gorm:"not null;type:text"`
	ImageURL    *string `gorm:"size:512"`
}

func (stepRow) TableName() string {
	return stepsTable
}

type ingredientRow struct {
	ID           uint64 `gorm:"primaryKey"`
	RecipeID     uint64 `gorm:"index;not null"`
	IngredientID uint64 `gorm:"not null"`
	Quantity     *float64
	UnitID       *uint64
	Note         *string
}

func (ingredientRow) TableName() string {
	return ingredientsTable
}

type tagRow struct {
	RecipeID uint64 `gorm:"primaryKey"`
	TagID    uint64 `gorm:"primaryKey"`
}

func (tagRow) TableName() string {
	return tagsTable
}

type recipeStatsRow struct {
	RecipeID      uint64 `gorm:"primaryKey"`
	LikesCount    int64  `gorm:"not null;default:0"`
	CommentsCount int64  `gorm:"not null;default:0"`
	UpdatedAt     time.Time
}

func (recipeStatsRow) TableName() string {
	return recipeStatsTable
}

type processedEventRow struct {
	EventID   string `gorm:"primaryKey;size:64"`
	EventType string `gorm:"not null;size:128"`
	CreatedAt time.Time
}

func (processedEventRow) TableName() string {
	return processedEventsTable
}
