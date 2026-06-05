package dto

import "time"

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
}

type Pagination struct {
	Total  int64 `json:"total"`
	Limit  int   `json:"limit"`
	Offset int   `json:"offset"`
}

type UserShort struct {
	ID          uint64  `json:"id"`
	Username    string  `json:"username"`
	DisplayName string  `json:"display_name"`
	AvatarURL   *string `json:"avatar_url"`
}

type UserProfile struct {
	ID             uint64    `json:"id"`
	Email          string    `json:"email"`
	Username       string    `json:"username"`
	DisplayName    string    `json:"display_name"`
	Bio            *string   `json:"bio"`
	AvatarURL      *string   `json:"avatar_url"`
	FollowersCount int64     `json:"followers_count"`
	FollowingCount int64     `json:"following_count"`
	RecipesCount   int64     `json:"recipes_count"`
	CreatedAt      time.Time `json:"created_at"`
}

type DishType struct {
	ID   uint64 `json:"id"`
	Name string `json:"name"`
}

type Difficulty struct {
	ID   uint64 `json:"id"`
	Name string `json:"name"`
}

type Tag struct {
	ID   uint64 `json:"id"`
	Name string `json:"name"`
}

type IngredientRef struct {
	ID   uint64 `json:"id"`
	Name string `json:"name"`
}

type MeasurementUnit struct {
	ID        uint64 `json:"id"`
	Name      string `json:"name"`
	ShortName string `json:"short_name"`
}

type RecipeStep struct {
	ID          uint64  `json:"id"`
	StepNumber  int     `json:"step_number"`
	Description string  `json:"description"`
	ImageURL    *string `json:"image_url"`
}

type RecipeIngredient struct {
	ID          uint64             `json:"id"`
	Ingredient  IngredientRef      `json:"ingredient"`
	Quantity    *float64           `json:"quantity"`
	Unit        *MeasurementUnit   `json:"unit"`
	Note        *string            `json:"note"`
}

type RecipeListItem struct {
	ID              uint64     `json:"id"`
	Title           string     `json:"title"`
	Description     *string    `json:"description"`
	CoverImageURL   *string    `json:"cover_image_url"`
	Author          UserShort  `json:"author"`
	DishType        *DishType  `json:"dish_type"`
	Difficulty      *Difficulty `json:"difficulty"`
	PrepTimeMinutes *int       `json:"prep_time_minutes"`
	CookTimeMinutes *int       `json:"cook_time_minutes"`
	Servings        *int       `json:"servings"`
	LikesCount      int64      `json:"likes_count"`
	CommentsCount   int64      `json:"comments_count"`
	Tags            []Tag      `json:"tags"`
	CreatedAt       time.Time  `json:"created_at"`
}

type RecipeFull struct {
	ID              uint64             `json:"id"`
	Title           string             `json:"title"`
	Description     *string            `json:"description"`
	CoverImageURL   *string            `json:"cover_image_url"`
	VideoURL        *string            `json:"video_url"`
	Author          UserShort          `json:"author"`
	DishType        *DishType          `json:"dish_type"`
	Difficulty      *Difficulty        `json:"difficulty"`
	PrepTimeMinutes *int               `json:"prep_time_minutes"`
	CookTimeMinutes *int               `json:"cook_time_minutes"`
	Servings        *int               `json:"servings"`
	LikesCount      int64              `json:"likes_count"`
	CommentsCount   int64              `json:"comments_count"`
	IsLiked         bool               `json:"is_liked"`
	IsSaved         bool               `json:"is_saved"`
	Steps           []RecipeStep       `json:"steps"`
	Ingredients     []RecipeIngredient `json:"ingredients"`
	Tags            []Tag              `json:"tags"`
	CreatedAt       time.Time          `json:"created_at"`
	UpdatedAt       time.Time          `json:"updated_at"`
}

type PostListItem struct {
	ID            uint64    `json:"id"`
	Title         string    `json:"title"`
	Content       string    `json:"content"`
	CoverImageURL *string   `json:"cover_image_url"`
	Author        UserShort `json:"author"`
	LikesCount    int64     `json:"likes_count"`
	CommentsCount int64     `json:"comments_count"`
	CreatedAt     time.Time `json:"created_at"`
}

type PostFull struct {
	ID            uint64    `json:"id"`
	Title         string    `json:"title"`
	Content       string    `json:"content"`
	CoverImageURL *string   `json:"cover_image_url"`
	Author        UserShort `json:"author"`
	LikesCount    int64     `json:"likes_count"`
	CommentsCount int64     `json:"comments_count"`
	IsLiked       bool      `json:"is_liked"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type Comment struct {
	ID              uint64    `json:"id"`
	Author          UserShort `json:"author"`
	Content         string    `json:"content"`
	ParentCommentID *uint64   `json:"parent_comment_id"`
	Replies         []Comment `json:"replies,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
}

type FollowUser struct {
	User      UserShort `json:"user"`
	CreatedAt time.Time `json:"created_at"`
}

type Liked struct {
	Liked      bool  `json:"liked"`
	LikesCount int64 `json:"likes_count"`
}

type Following struct {
	Following bool `json:"following"`
}

type Saved struct {
	Saved bool `json:"saved"`
}
