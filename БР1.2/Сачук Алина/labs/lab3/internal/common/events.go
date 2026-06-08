package common

import "time"

const (
	EventRecipeLiked      = "recipe.liked"
	EventRecipeUnliked    = "recipe.unliked"
	EventRecipeSaved      = "recipe.saved"
	EventRecipeUnsaved    = "recipe.unsaved"
	EventCommentCreated   = "comment.created"
	EventCommentDeleted   = "comment.deleted"
	DefaultRabbitMQQueue  = "recipe-events"
	DefaultRabbitMQUser   = "guest"
	DefaultRabbitMQPass   = "guest"
	DefaultRabbitMQAPIURL = "http://localhost:15672"
)

type RecipeEvent struct {
	Type      string    `json:"type"`
	RecipeID  int       `json:"recipe_id"`
	UserID    int       `json:"user_id"`
	Delta     int       `json:"delta"`
	CreatedAt time.Time `json:"created_at"`
}
