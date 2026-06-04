package engagement

import (
	"context"
	"testing"

	engagementdomain "recipehub/internal/domain/engagement"
)

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
	if repo.isSavedCalls != 2 {
		t.Fatalf("IsSaved calls = %d, want 2", repo.isSavedCalls)
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
	if repo.isSavedCalls != 0 {
		t.Fatalf("IsSaved calls = %d, want 0", repo.isSavedCalls)
	}
}

type statsRepository struct {
	stats        []engagementdomain.Stat
	liked        map[uint64]bool
	saved        map[uint64]bool
	isSavedCalls int
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

func (r *statsRepository) CreateComment(_ context.Context, comment engagementdomain.Comment) (engagementdomain.Comment, error) {
	return comment, nil
}

func (r *statsRepository) DeleteCommentSubtree(context.Context, uint64) error {
	return nil
}

func (r *statsRepository) Like(context.Context, engagementdomain.TargetType, uint64, uint64) error {
	return nil
}

func (r *statsRepository) Unlike(context.Context, engagementdomain.TargetType, uint64, uint64) error {
	return nil
}

func (r *statsRepository) LikesCount(context.Context, engagementdomain.TargetType, uint64) (int64, error) {
	return 0, nil
}

func (r *statsRepository) IsLiked(_ context.Context, _ engagementdomain.TargetType, _ uint64, targetID uint64) (bool, error) {
	return r.liked[targetID], nil
}

func (r *statsRepository) SaveRecipe(context.Context, uint64, uint64) error {
	return nil
}

func (r *statsRepository) UnsaveRecipe(context.Context, uint64, uint64) error {
	return nil
}

func (r *statsRepository) IsSaved(_ context.Context, _ uint64, recipeID uint64) (bool, error) {
	r.isSavedCalls++

	return r.saved[recipeID], nil
}

func (r *statsRepository) ListSavedRecipes(context.Context, uint64, int, int) (engagementdomain.Page[engagementdomain.SavedRecipe], error) {
	return engagementdomain.Page[engagementdomain.SavedRecipe]{}, nil
}

func (r *statsRepository) StatsBatch(context.Context, engagementdomain.TargetType, []uint64) ([]engagementdomain.Stat, error) {
	return append([]engagementdomain.Stat(nil), r.stats...), nil
}
