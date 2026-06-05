package reciperepo

import (
	"errors"
	"testing"

	eventsdomain "recipehub/internal/domain/events"
)

func TestRecipeEventDelta(t *testing.T) {
	tests := []struct {
		name         string
		eventType    string
		payload      any
		targetID     uint64
		likesDelta   int64
		commentDelta int64
	}{
		{
			name:       "liked",
			eventType:  eventsdomain.TypeRecipeLiked,
			payload:    eventsdomain.LikePayload{TargetID: 10, UserID: 7},
			targetID:   10,
			likesDelta: 1,
		},
		{
			name:       "unliked",
			eventType:  eventsdomain.TypeRecipeUnliked,
			payload:    eventsdomain.LikePayload{TargetID: 10, UserID: 7},
			targetID:   10,
			likesDelta: -1,
		},
		{
			name:         "comment created",
			eventType:    eventsdomain.TypeRecipeCommentCreated,
			payload:      eventsdomain.CommentCreatedPayload{TargetID: 10, CommentID: 99, AuthorID: 7},
			targetID:     10,
			commentDelta: 1,
		},
		{
			name:         "comment deleted",
			eventType:    eventsdomain.TypeRecipeCommentDeleted,
			payload:      eventsdomain.CommentDeletedPayload{TargetID: 10, CommentID: 99, DeletedCount: 3},
			targetID:     10,
			commentDelta: -3,
		},
		{
			name:      "foreign event ignored",
			eventType: eventsdomain.TypePostLiked,
			payload:   eventsdomain.LikePayload{TargetID: 10, UserID: 7},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			event, err := eventsdomain.NewEnvelope(tt.eventType, tt.payload)
			if err != nil {
				t.Fatalf("NewEnvelope: %v", err)
			}

			targetID, likesDelta, commentDelta, err := recipeEventDelta(event)
			if err != nil {
				t.Fatalf("recipeEventDelta: %v", err)
			}
			if targetID != tt.targetID || likesDelta != tt.likesDelta || commentDelta != tt.commentDelta {
				t.Fatalf("delta = target:%d likes:%d comments:%d, want target:%d likes:%d comments:%d",
					targetID, likesDelta, commentDelta, tt.targetID, tt.likesDelta, tt.commentDelta)
			}
		})
	}
}

func TestDuplicateKeyDetection(t *testing.T) {
	if !isDuplicateKey(errors.New("duplicate key value violates unique constraint")) {
		t.Fatal("duplicate key error was not detected")
	}
}
