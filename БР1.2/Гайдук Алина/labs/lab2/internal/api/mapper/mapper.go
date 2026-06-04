package mapper

import (
	"slices"
	"time"

	"recipehub/internal/api/dto"
	"recipehub/internal/infrastructure/database/model"
)

func UserShort(u model.User) dto.UserShort {
	return dto.UserShort{
		ID:          u.ID,
		Username:    u.Username,
		DisplayName: u.DisplayName,
		AvatarURL:   u.AvatarURL,
	}
}

func UserProfile(store interface {
	UserFollowersCount(uint64) int64
	UserFollowingCount(uint64) int64
	UserRecipesCount(uint64) int64
}, u model.User) dto.UserProfile {
	return dto.UserProfile{
		ID:             u.ID,
		Email:          u.Email,
		Username:       u.Username,
		DisplayName:    u.DisplayName,
		Bio:            u.Bio,
		AvatarURL:      u.AvatarURL,
		FollowersCount: store.UserFollowersCount(u.ID),
		FollowingCount: store.UserFollowingCount(u.ID),
		RecipesCount:   store.UserRecipesCount(u.ID),
		CreatedAt:      u.CreatedAt,
	}
}

func DishTypePtr(d *model.DishType) *dto.DishType {
	if d == nil {
		return nil
	}
	return &dto.DishType{ID: d.ID, Name: d.Name}
}

func DifficultyPtr(d *model.Difficulty) *dto.Difficulty {
	if d == nil {
		return nil
	}
	return &dto.Difficulty{ID: d.ID, Name: d.Name}
}

func Tags(tags []model.Tag) []dto.Tag {
	out := make([]dto.Tag, 0, len(tags))
	for _, t := range tags {
		out = append(out, dto.Tag{ID: t.ID, Name: t.Name})
	}
	return out
}

func RecipeListItem(store interface {
	RecipeLikesCount(uint64) int64
	RecipeCommentsCount(uint64) int64
}, r *model.Recipe) dto.RecipeListItem {
	return dto.RecipeListItem{
		ID:              r.ID,
		Title:           r.Title,
		Description:     r.Description,
		CoverImageURL:   r.CoverImageURL,
		Author:          UserShort(r.Author),
		DishType:        DishTypePtr(r.DishType),
		Difficulty:      DifficultyPtr(r.Difficulty),
		PrepTimeMinutes: r.PrepTimeMinutes,
		CookTimeMinutes: r.CookTimeMinutes,
		Servings:        r.Servings,
		LikesCount:      store.RecipeLikesCount(r.ID),
		CommentsCount:   store.RecipeCommentsCount(r.ID),
		Tags:            Tags(r.Tags),
		CreatedAt:       r.CreatedAt,
	}
}

func RecipeFull(store interface {
	RecipeLikesCount(uint64) int64
	RecipeCommentsCount(uint64) int64
	IsRecipeLiked(uint64, uint64) bool
	IsRecipeSaved(uint64, uint64) bool
}, r *model.Recipe, viewer *uint64) dto.RecipeFull {
	lc := store.RecipeLikesCount(r.ID)
	cc := store.RecipeCommentsCount(r.ID)
	isLiked := false
	isSaved := false
	if viewer != nil {
		isLiked = store.IsRecipeLiked(*viewer, r.ID)
		isSaved = store.IsRecipeSaved(*viewer, r.ID)
	}
	steps := make([]dto.RecipeStep, 0, len(r.Steps))
	for _, s := range r.Steps {
		steps = append(steps, dto.RecipeStep{
			ID:          s.ID,
			StepNumber:  s.StepNumber,
			Description: s.Description,
			ImageURL:    s.ImageURL,
		})
	}
	ing := make([]dto.RecipeIngredient, 0, len(r.Ingredients))
	for _, x := range r.Ingredients {
		var u *dto.MeasurementUnit
		if x.Unit != nil {
			u = &dto.MeasurementUnit{ID: x.Unit.ID, Name: x.Unit.Name, ShortName: x.Unit.ShortName}
		}
		ing = append(ing, dto.RecipeIngredient{
			ID: x.ID,
			Ingredient: dto.IngredientRef{
				ID: x.Ingredient.ID, Name: x.Ingredient.Name,
			},
			Quantity: x.Quantity,
			Unit:     u,
			Note:     x.Note,
		})
	}
	return dto.RecipeFull{
		ID:              r.ID,
		Title:           r.Title,
		Description:     r.Description,
		CoverImageURL:   r.CoverImageURL,
		VideoURL:        r.VideoURL,
		Author:          UserShort(r.Author),
		DishType:        DishTypePtr(r.DishType),
		Difficulty:      DifficultyPtr(r.Difficulty),
		PrepTimeMinutes: r.PrepTimeMinutes,
		CookTimeMinutes: r.CookTimeMinutes,
		Servings:        r.Servings,
		LikesCount:      lc,
		CommentsCount:   cc,
		IsLiked:         isLiked,
		IsSaved:         isSaved,
		Steps:           steps,
		Ingredients:     ing,
		Tags:            Tags(r.Tags),
		CreatedAt:       r.CreatedAt,
		UpdatedAt:       r.UpdatedAt,
	}
}

func PostListItem(store interface {
	PostLikesCount(uint64) int64
	PostCommentsCount(uint64) int64
}, p *model.Post) dto.PostListItem {
	return dto.PostListItem{
		ID:            p.ID,
		Title:         p.Title,
		Content:       p.Content,
		CoverImageURL: p.CoverImageURL,
		Author:        UserShort(p.Author),
		LikesCount:    store.PostLikesCount(p.ID),
		CommentsCount: store.PostCommentsCount(p.ID),
		CreatedAt:     p.CreatedAt,
	}
}

func PostFull(store interface {
	PostLikesCount(uint64) int64
	PostCommentsCount(uint64) int64
	IsPostLiked(uint64, uint64) bool
}, p *model.Post, viewer *uint64) dto.PostFull {
	lc := store.PostLikesCount(p.ID)
	cc := store.PostCommentsCount(p.ID)
	is := false
	if viewer != nil {
		is = store.IsPostLiked(*viewer, p.ID)
	}
	return dto.PostFull{
		ID:            p.ID,
		Title:         p.Title,
		Content:       p.Content,
		CoverImageURL: p.CoverImageURL,
		Author:        UserShort(p.Author),
		LikesCount:    lc,
		CommentsCount: cc,
		IsLiked:       is,
		CreatedAt:     p.CreatedAt,
		UpdatedAt:     p.UpdatedAt,
	}
}

func indexCommentsByParentID(flat []model.Comment) map[uint64][]model.Comment {
	byParent := make(map[uint64][]model.Comment)
	for _, r := range flat {
		if r.ParentCommentID == nil {
			continue
		}
		pid := *r.ParentCommentID
		byParent[pid] = append(byParent[pid], r)
	}
	sortCommentBranches(byParent)
	return byParent
}

func sortCommentBranches(byParent map[uint64][]model.Comment) {
	for pid := range byParent {
		slices.SortFunc(byParent[pid], func(a, b model.Comment) int {
			return a.CreatedAt.Compare(b.CreatedAt)
		})
	}
}

func CommentThread(c model.Comment, replies []model.Comment) dto.Comment {
	out := dto.Comment{
		ID:              c.ID,
		Author:          UserShort(c.Author),
		Content:         c.Content,
		ParentCommentID: c.ParentCommentID,
		CreatedAt:       c.CreatedAt,
	}
	if len(replies) == 0 {
		return out
	}
	return CommentWithReplies(c, indexCommentsByParentID(replies))
}

// CommentWithReplies собирает вложенную DTO комментария из плоской карты "родитель к дочерним".
func CommentWithReplies(c model.Comment, byParent map[uint64][]model.Comment) dto.Comment {
	children := byParent[c.ID]
	replies := make([]dto.Comment, 0, len(children))
	for _, ch := range children {
		replies = append(replies, CommentWithReplies(ch, byParent))
	}
	return dto.Comment{
		ID:              c.ID,
		Author:          UserShort(c.Author),
		Content:         c.Content,
		ParentCommentID: c.ParentCommentID,
		Replies:         replies,
		CreatedAt:       c.CreatedAt,
	}
}

// CommentForest собирает корневые комментарии с произвольно вложенными ответами. В срезе потомков должны быть только нерутовые узлы из веток этих корней.
func CommentForest(roots []model.Comment, descendants []model.Comment) []dto.Comment {
	byParent := indexCommentsByParentID(descendants)
	out := make([]dto.Comment, 0, len(roots))
	for _, root := range roots {
		out = append(out, CommentWithReplies(root, byParent))
	}
	return out
}

func FollowUserDTO(u model.User, created time.Time) dto.FollowUser {
	return dto.FollowUser{
		User:      UserShort(u),
		CreatedAt: created,
	}
}
