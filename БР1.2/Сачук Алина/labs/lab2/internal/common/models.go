package common

import "time"

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UpdateUserRequest struct {
	Username *string `json:"username"`
	Bio      *string `json:"bio"`
}

type AuthResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	User        User   `json:"user"`
}

type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	Bio          *string   `json:"bio,omitempty"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

type IngredientInput struct {
	Name   string `json:"name"`
	Amount string `json:"amount"`
}

type StepInput struct {
	StepNumber int    `json:"step_number"`
	Text       string `json:"text"`
}

type CreateRecipeRequest struct {
	Title       string            `json:"title"`
	Description *string           `json:"description"`
	DishType    string            `json:"dish_type"`
	Difficulty  string            `json:"difficulty"`
	CookingTime *int              `json:"cooking_time"`
	PhotoURL    *string           `json:"photo_url"`
	VideoURL    *string           `json:"video_url"`
	Ingredients []IngredientInput `json:"ingredients"`
	Steps       []StepInput       `json:"steps"`
}

type Ingredient struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Amount string `json:"amount"`
}

type Step struct {
	ID         int    `json:"id"`
	StepNumber int    `json:"step_number"`
	Text       string `json:"text"`
}

type RecipeCard struct {
	ID            int       `json:"id"`
	UserID        int       `json:"user_id"`
	Title         string    `json:"title"`
	Description   *string   `json:"description,omitempty"`
	DishType      string    `json:"dish_type"`
	Difficulty    string    `json:"difficulty"`
	CookingTime   *int      `json:"cooking_time,omitempty"`
	PhotoURL      *string   `json:"photo_url,omitempty"`
	VideoURL      *string   `json:"video_url,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	LikesCount    int       `json:"likes_count"`
	CommentsCount int       `json:"comments_count"`
}

type RecipeDetails struct {
	RecipeCard
	Ingredients []Ingredient `json:"ingredients"`
	Steps       []Step       `json:"steps"`
}

type RecipeListResponse struct {
	Items    []RecipeCard `json:"items"`
	Page     int          `json:"page"`
	PageSize int          `json:"page_size"`
	Total    int          `json:"total"`
}

type CreateCommentRequest struct {
	Text string `json:"text"`
}

type Comment struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	RecipeID  int       `json:"recipe_id"`
	Text      string    `json:"text"`
	CreatedAt time.Time `json:"created_at"`
}

type CommentListResponse struct {
	Items    []Comment `json:"items"`
	Page     int       `json:"page"`
	PageSize int       `json:"page_size"`
	Total    int       `json:"total"`
}

type UserListResponse struct {
	Items []User `json:"items"`
	Total int    `json:"total"`
}

type ErrorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type ErrorResponse struct {
	Error ErrorBody `json:"error"`
}
