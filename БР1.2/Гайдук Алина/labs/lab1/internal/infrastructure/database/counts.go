package database

import "recipehub/internal/infrastructure/database/model"

func (s *Store) RecipeLikesCount(recipeID uint64) int64 {
	var c int64
	_ = s.DB.Model(&model.RecipeLike{}).Where("recipe_id = ?", recipeID).Count(&c).Error
	return c
}

func (s *Store) RecipeCommentsCount(recipeID uint64) int64 {
	var c int64
	_ = s.DB.Model(&model.Comment{}).
		Where("recipe_id = ? AND post_id IS NULL", recipeID).
		Count(&c).Error
	return c
}

func (s *Store) PostLikesCount(postID uint64) int64 {
	var c int64
	_ = s.DB.Model(&model.PostLike{}).Where("post_id = ?", postID).Count(&c).Error
	return c
}

func (s *Store) PostCommentsCount(postID uint64) int64 {
	var c int64
	_ = s.DB.Model(&model.Comment{}).
		Where("post_id = ? AND recipe_id IS NULL", postID).
		Count(&c).Error
	return c
}

func (s *Store) UserFollowersCount(userID uint64) int64 {
	var c int64
	_ = s.DB.Model(&model.Follow{}).Where("following_id = ?", userID).Count(&c).Error
	return c
}

func (s *Store) UserFollowingCount(userID uint64) int64 {
	var c int64
	_ = s.DB.Model(&model.Follow{}).Where("follower_id = ?", userID).Count(&c).Error
	return c
}

func (s *Store) UserRecipesCount(userID uint64) int64 {
	var c int64
	_ = s.DB.Model(&model.Recipe{}).Where("author_id = ?", userID).Count(&c).Error
	return c
}

func (s *Store) IsRecipeLiked(userID, recipeID uint64) bool {
	var c int64
	_ = s.DB.Model(&model.RecipeLike{}).
		Where("user_id = ? AND recipe_id = ?", userID, recipeID).
		Count(&c).Error
	return c > 0
}

func (s *Store) IsRecipeSaved(userID, recipeID uint64) bool {
	var c int64
	_ = s.DB.Model(&model.SavedRecipe{}).
		Where("user_id = ? AND recipe_id = ?", userID, recipeID).
		Count(&c).Error
	return c > 0
}

func (s *Store) IsPostLiked(userID, postID uint64) bool {
	var c int64
	_ = s.DB.Model(&model.PostLike{}).
		Where("user_id = ? AND post_id = ?", userID, postID).
		Count(&c).Error
	return c > 0
}
