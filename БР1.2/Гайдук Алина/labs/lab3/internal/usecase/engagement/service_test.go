package engagement

import (
	"context"
	"encoding/json"
	"testing"

	engagementdomain "recipehub/internal/domain/engagement"
	eventsdomain "recipehub/internal/domain/events"
	recipedomain "recipehub/internal/domain/recipe"
)

func TestLikeEnqueuesRecipeLikedEvent(t *testing.T) {
	repo := &statsRepository{}
	service := NewService(repo, nil, targetRecipeGateway{}, nil)

	if _, err := service.Like(context.Background(), engagementdomain.TargetRecipe, 7, 10); err != nil {
		t.Fatalf("Like returned error: %v", err)
	}

	if len(repo.events) != 1 {
		t.Fatalf("outbox events = %d, want 1", len(repo.events))
	}
	event := repo.events[0]
	if event.EventType != eventsdomain.TypeRecipeLiked {
		t.Fatalf("event type = %s, want %s", event.EventType, eventsdomain.TypeRecipeLiked)
	}

	var payload eventsdomain.LikePayload
	if err := json.Unmarshal(event.Payload, &payload); err != nil {
		t.Fatalf("payload unmarshal: %v", err)
	}
	if payload.TargetID != 10 || payload.UserID != 7 {
		t.Fatalf("payload = %+v, want target 10 user 7", payload)
	}
}

func TestLikeDoesNotEnqueueWhenRepositoryFails(t *testing.T) {
	repo := &statsRepository{likeErr: ErrAlreadyExists}
	service := NewService(repo, nil, targetRecipeGateway{}, nil)

	if _, err := service.Like(context.Background(), engagementdomain.TargetRecipe, 7, 10); err == nil {
		t.Fatal("Like returned nil error, want repository error")
	}
	if len(repo.events) != 0 {
		t.Fatalf("outbox events = %d, want 0", len(repo.events))
	}
}

func TestStatsBatchAddsRecipeViewerFlags(t *testing.T) {
	repo := &statsRepository{
		stats: []engagementdomain.Stat{
			{TargetID: 10, LikesCount: 3, CommentsCount: 2},
			{TargetID: 11, LikesCount: 1, CommentsCount: 0},
		},
		liked: map[uint64]bool{10: true},
		saved: map[uint64]bool{11: true},
	}
	service := NewService(repo, nil, nil, nil)
	viewerID := uint64(7)

	got, err := service.StatsBatch(context.Background(), engagementdomain.TargetRecipe, []uint64{10, 11}, &viewerID)
	if err != nil {
		t.Fatalf("StatsBatch returned error: %v", err)
	}

	if !got[0].IsLiked || got[0].IsSaved {
		t.Fatalf("recipe 10 flags = liked:%v saved:%v, want liked:true saved:false", got[0].IsLiked, got[0].IsSaved)
	}
	if got[1].IsLiked || !got[1].IsSaved {
		t.Fatalf("recipe 11 flags = liked:%v saved:%v, want liked:false saved:true", got[1].IsLiked, got[1].IsSaved)
	}
	if repo.savedBatchCalls != 1 {
		t.Fatalf("SavedRecipeIDs calls = %d, want 1", repo.savedBatchCalls)
	}
}

func TestStatsBatchAddsPostViewerFlagsWithoutSavedLookup(t *testing.T) {
	repo := &statsRepository{
		stats: []engagementdomain.Stat{{TargetID: 20, LikesCount: 4, CommentsCount: 1}},
		liked: map[uint64]bool{20: true},
	}
	service := NewService(repo, nil, nil, nil)
	viewerID := uint64(7)

	got, err := service.StatsBatch(context.Background(), engagementdomain.TargetPost, []uint64{20}, &viewerID)
	if err != nil {
		t.Fatalf("StatsBatch returned error: %v", err)
	}

	if !got[0].IsLiked {
		t.Fatal("IsLiked = false, want true")
	}
	if got[0].IsSaved {
		t.Fatal("IsSaved = true, want false for post stats")
	}
	if repo.savedBatchCalls != 0 {
		t.Fatalf("SavedRecipeIDs calls = %d, want 0", repo.savedBatchCalls)
	}
}

type statsRepository struct {
	stats           []engagementdomain.Stat
	liked           map[uint64]bool
	saved           map[uint64]bool
	savedBatchCalls int
	likeErr         error
	events          []eventsdomain.Envelope
}

func (r *statsRepository) ListComments(context.Context, engagementdomain.TargetType, uint64, int, int) (engagementdomain.Page[engagementdomain.Comment], error) {
	return engagementdomain.Page[engagementdomain.Comment]{}, nil
}

func (r *statsRepository) CommentDescendants(context.Context, engagementdomain.TargetType, uint64, []uint64) ([]engagementdomain.Comment, error) {
	return nil, nil
}

func (r *statsRepository) CommentByID(context.Context, uint64) (engagementdomain.Comment, error) {
	return engagementdomain.Comment{}, nil
}

func (r *statsRepository) CreateComment(_ context.Context, comment engagementdomain.Comment, eventType string) (engagementdomain.Comment, error) {
	event, err := eventsdomain.NewEnvelope(eventType, eventsdomain.CommentCreatedPayload{
		TargetID:  comment.TargetID,
		CommentID: comment.ID,
		AuthorID:  comment.AuthorID,
	})
	if err != nil {
		return engagementdomain.Comment{}, err
	}
	r.events = append(r.events, event)

	return comment, nil
}

func (r *statsRepository) DeleteCommentSubtree(_ context.Context, comment engagementdomain.Comment, eventType string) (int64, error) {
	event, err := eventsdomain.NewEnvelope(eventType, eventsdomain.CommentDeletedPayload{
		TargetID:     comment.TargetID,
		CommentID:    comment.ID,
		DeletedCount: 1,
	})
	if err != nil {
		return 0, err
	}
	r.events = append(r.events, event)

	return 1, nil
}

func (r *statsRepository) Like(_ context.Context, _ engagementdomain.TargetType, userID, targetID uint64, eventType string) error {
	if r.likeErr != nil {
		return r.likeErr
	}

	event, err := eventsdomain.NewEnvelope(eventType, eventsdomain.LikePayload{TargetID: targetID, UserID: userID})
	if err != nil {
		return err
	}
	r.events = append(r.events, event)

	return nil
}

func (r *statsRepository) Unlike(_ context.Context, _ engagementdomain.TargetType, userID, targetID uint64, eventType string) error {
	event, err := eventsdomain.NewEnvelope(eventType, eventsdomain.LikePayload{TargetID: targetID, UserID: userID})
	if err != nil {
		return err
	}
	r.events = append(r.events, event)

	return nil
}

func (r *statsRepository) LikesCount(context.Context, engagementdomain.TargetType, uint64) (int64, error) {
	return 0, nil
}

func (r *statsRepository) IsLiked(_ context.Context, _ engagementdomain.TargetType, _ uint64, targetID uint64) (bool, error) {
	return r.liked[targetID], nil
}

func (r *statsRepository) LikedIDs(_ context.Context, _ engagementdomain.TargetType, _ uint64, targetIDs []uint64) (map[uint64]bool, error) {
	out := make(map[uint64]bool, len(targetIDs))
	for _, id := range targetIDs {
		out[id] = r.liked[id]
	}

	return out, nil
}

func (r *statsRepository) SaveRecipe(context.Context, uint64, uint64) error {
	return nil
}

func (r *statsRepository) UnsaveRecipe(context.Context, uint64, uint64) error {
	return nil
}

func (r *statsRepository) IsSaved(_ context.Context, _ uint64, recipeID uint64) (bool, error) {
	return r.saved[recipeID], nil
}

func (r *statsRepository) SavedRecipeIDs(_ context.Context, _ uint64, recipeIDs []uint64) (map[uint64]bool, error) {
	r.savedBatchCalls++

	out := make(map[uint64]bool, len(recipeIDs))
	for _, id := range recipeIDs {
		out[id] = r.saved[id]
	}

	return out, nil
}

func (r *statsRepository) ListSavedRecipes(context.Context, uint64, int, int) (engagementdomain.Page[engagementdomain.SavedRecipe], error) {
	return engagementdomain.Page[engagementdomain.SavedRecipe]{}, nil
}

func (r *statsRepository) StatsBatch(context.Context, engagementdomain.TargetType, []uint64) ([]engagementdomain.Stat, error) {
	return append([]engagementdomain.Stat(nil), r.stats...), nil
}

type targetRecipeGateway struct{}

func (targetRecipeGateway) RecipeExists(context.Context, uint64) (bool, error) {
	return true, nil
}

func (targetRecipeGateway) RecipeBrief(context.Context, uint64) (recipedomain.Recipe, error) {
	return recipedomain.Recipe{}, nil
}

func (targetRecipeGateway) RecipeBriefsBatch(context.Context, []uint64) ([]recipedomain.Recipe, error) {
	return nil, nil
}
