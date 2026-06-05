package blogrepo

import (
	"errors"
	"testing"

	eventsdomain "recipehub/internal/domain/events"
)

func TestPostEventDelta(t *testing.T) {
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
			eventType:  eventsdomain.TypePostLiked,
			payload:    eventsdomain.LikePayload{TargetID: 20, UserID: 7},
			targetID:   20,
			likesDelta: 1,
		},
		{
			name:       "unliked",
			eventType:  eventsdomain.TypePostUnliked,
			payload:    eventsdomain.LikePayload{TargetID: 20, UserID: 7},
			targetID:   20,
			likesDelta: -1,
		},
		{
			name:         "comment created",
			eventType:    eventsdomain.TypePostCommentCreated,
			payload:      eventsdomain.CommentCreatedPayload{TargetID: 20, CommentID: 99, AuthorID: 7},
			targetID:     20,
			commentDelta: 1,
		},
		{
			name:         "comment deleted",
			eventType:    eventsdomain.TypePostCommentDeleted,
			payload:      eventsdomain.CommentDeletedPayload{TargetID: 20, CommentID: 99, DeletedCount: 2},
			targetID:     20,
			commentDelta: -2,
		},
		{
			name:      "foreign event ignored",
			eventType: eventsdomain.TypeRecipeLiked,
			payload:   eventsdomain.LikePayload{TargetID: 20, UserID: 7},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			event, err := eventsdomain.NewEnvelope(tt.eventType, tt.payload)
			if err != nil {
				t.Fatalf("NewEnvelope: %v", err)
			}

			targetID, likesDelta, commentDelta, err := postEventDelta(event)
			if err != nil {
				t.Fatalf("postEventDelta: %v", err)
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
