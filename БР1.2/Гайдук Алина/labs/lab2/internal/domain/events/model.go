// Package events contains integration event contracts shared by services.
package events

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"time"
)

const (
	TypeRecipeLiked          = "recipe.liked"
	TypeRecipeUnliked        = "recipe.unliked"
	TypeRecipeCommentCreated = "recipe.comment.created"
	TypeRecipeCommentDeleted = "recipe.comment.deleted"
	TypePostLiked            = "post.liked"
	TypePostUnliked          = "post.unliked"
	TypePostCommentCreated   = "post.comment.created"
	TypePostCommentDeleted   = "post.comment.deleted"
)

type Envelope struct {
	EventID    string          `json:"event_id"`
	EventType  string          `json:"event_type"`
	OccurredAt time.Time       `json:"occurred_at"`
	Payload    json.RawMessage `json:"payload"`
}

type LikePayload struct {
	TargetID uint64 `json:"target_id"`
	UserID   uint64 `json:"user_id"`
}

type CommentCreatedPayload struct {
	TargetID  uint64 `json:"target_id"`
	CommentID uint64 `json:"comment_id"`
	AuthorID  uint64 `json:"author_id"`
}

type CommentDeletedPayload struct {
	TargetID     uint64 `json:"target_id"`
	CommentID    uint64 `json:"comment_id"`
	DeletedCount int64  `json:"deleted_count"`
}

func NewEnvelope(eventType string, payload any) (Envelope, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return Envelope{}, err
	}

	return Envelope{
		EventID:    newEventID(),
		EventType:  eventType,
		OccurredAt: time.Now().UTC(),
		Payload:    body,
	}, nil
}

func newEventID() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err == nil {
		return hex.EncodeToString(b[:])
	}

	return time.Now().UTC().Format("20060102150405.000000000")
}
