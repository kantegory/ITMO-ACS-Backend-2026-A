package model

import "time"

type User struct {
	ID           uint64 `gorm:"primaryKey"`
	Email        string `gorm:"uniqueIndex;not null;size:255"`
	Username     string `gorm:"uniqueIndex;not null;size:100"`
	PasswordHash string `gorm:"not null;size:255"`
	DisplayName  string `gorm:"not null;size:100"`
	Bio          *string
	AvatarURL    *string `gorm:"size:512"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type RefreshToken struct {
	ID        uint64 `gorm:"primaryKey"`
	UserID    uint64 `gorm:"index;not null"`
	User      User   `gorm:"constraint:OnDelete:CASCADE"`
	TokenHash string `gorm:"uniqueIndex;not null;size:64"`
	ExpiresAt time.Time
}

type DishType struct {
	ID   uint64 `gorm:"primaryKey"`
	Name string `gorm:"uniqueIndex;not null;size:100"`
}

type Difficulty struct {
	ID   uint64 `gorm:"primaryKey"`
	Name string `gorm:"not null;size:100"`
}

type Tag struct {
	ID   uint64 `gorm:"primaryKey"`
	Name string `gorm:"uniqueIndex;not null;size:100"`
}

type Ingredient struct {
	ID   uint64 `gorm:"primaryKey"`
	Name string `gorm:"uniqueIndex;not null;size:200"`
}

type MeasurementUnit struct {
	ID        uint64 `gorm:"primaryKey"`
	Name      string `gorm:"not null;size:100"`
	ShortName string `gorm:"not null;size:20"`
}

type Recipe struct {
	ID              uint64 `gorm:"primaryKey"`
	AuthorID        uint64 `gorm:"index;not null"`
	Author          User   `gorm:"constraint:OnDelete:CASCADE"`
	Title           string `gorm:"not null;size:255;index"`
	Description     *string
	CoverImageURL   *string `gorm:"size:512"`
	VideoURL        *string `gorm:"size:512"`
	DishTypeID      *uint64
	DishType        *DishType `gorm:"constraint:OnDelete:SET NULL"`
	DifficultyID    *uint64
	Difficulty      *Difficulty `gorm:"constraint:OnDelete:SET NULL"`
	PrepTimeMinutes *int
	CookTimeMinutes *int
	Servings        *int
	Steps           []RecipeStep       `gorm:"constraint:OnDelete:CASCADE"`
	Ingredients     []RecipeIngredient `gorm:"constraint:OnDelete:CASCADE"`
	Tags            []Tag              `gorm:"many2many:recipe_tags;constraint:OnDelete:CASCADE"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

type RecipeStep struct {
	ID          uint64  `gorm:"primaryKey"`
	RecipeID    uint64  `gorm:"index;not null"`
	StepNumber  int     `gorm:"not null"`
	Description string  `gorm:"not null;type:text"`
	ImageURL    *string `gorm:"size:512"`
}

type RecipeIngredient struct {
	ID           uint64     `gorm:"primaryKey"`
	RecipeID     uint64     `gorm:"index;not null"`
	IngredientID uint64     `gorm:"not null"`
	Ingredient   Ingredient `gorm:"constraint:OnDelete:CASCADE"`
	Quantity     *float64
	UnitID       *uint64
	Unit         *MeasurementUnit `gorm:"constraint:OnDelete:SET NULL"`
	Note         *string
}

type Post struct {
	ID            uint64  `gorm:"primaryKey"`
	AuthorID      uint64  `gorm:"index;not null"`
	Author        User    `gorm:"constraint:OnDelete:CASCADE"`
	Title         string  `gorm:"not null;size:255"`
	Content       string  `gorm:"not null;type:text"`
	CoverImageURL *string `gorm:"size:512"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

type Comment struct {
	ID              uint64  `gorm:"primaryKey"`
	AuthorID        uint64  `gorm:"index;not null"`
	Author          User    `gorm:"constraint:OnDelete:CASCADE"`
	RecipeID        *uint64 `gorm:"index"`
	PostID          *uint64 `gorm:"index"`
	ParentCommentID *uint64 `gorm:"index"`
	Content         string  `gorm:"not null;type:text"`
	CreatedAt       time.Time
}

type RecipeLike struct {
	UserID   uint64 `gorm:"primaryKey"`
	RecipeID uint64 `gorm:"primaryKey"`
	User     User   `gorm:"constraint:OnDelete:CASCADE"`
	Recipe   Recipe `gorm:"constraint:OnDelete:CASCADE"`
}

type PostLike struct {
	UserID uint64 `gorm:"primaryKey"`
	PostID uint64 `gorm:"primaryKey"`
	User   User   `gorm:"constraint:OnDelete:CASCADE"`
	Post   Post   `gorm:"constraint:OnDelete:CASCADE"`
}

type Follow struct {
	FollowerID  uint64 `gorm:"primaryKey"`
	FollowingID uint64 `gorm:"primaryKey"`
	CreatedAt   time.Time
}

type SavedRecipe struct {
	UserID    uint64    `gorm:"primaryKey"`
	RecipeID  uint64    `gorm:"primaryKey"`
	User      User      `gorm:"constraint:OnDelete:CASCADE"`
	Recipe    Recipe    `gorm:"constraint:OnDelete:CASCADE"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}
