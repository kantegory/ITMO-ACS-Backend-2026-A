package database

import (
	"slices"

	"recipehub/internal/infrastructure/database/model"
)

func (s *Store) RecipeLike(userID, recipeID uint64) error {
	row := model.RecipeLike{UserID: userID, RecipeID: recipeID}
	return s.DB.Create(&row).Error
}

func (s *Store) RecipeUnlike(userID, recipeID uint64) error {
	return s.DB.Where("user_id = ? AND recipe_id = ?", userID, recipeID).
		Delete(&model.RecipeLike{}).Error
}

func (s *Store) PostLike(userID, postID uint64) error {
	row := model.PostLike{UserID: userID, PostID: postID}
	return s.DB.Create(&row).Error
}

func (s *Store) PostUnlike(userID, postID uint64) error {
	return s.DB.Where("user_id = ? AND post_id = ?", userID, postID).
		Delete(&model.PostLike{}).Error
}

func (s *Store) SaveRecipeForUser(userID, recipeID uint64) error {
	row := model.SavedRecipe{UserID: userID, RecipeID: recipeID}
	return s.DB.Create(&row).Error
}

func (s *Store) UnsaveRecipeForUser(userID, recipeID uint64) error {
	return s.DB.Where("user_id = ? AND recipe_id = ?", userID, recipeID).
		Delete(&model.SavedRecipe{}).Error
}

func (s *Store) ListSavedRecipes(userID uint64, limit, offset int) ([]model.Recipe, int64, error) {
	var total int64
	if err := s.DB.Model(&model.SavedRecipe{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []model.SavedRecipe
	err := s.DB.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(max1(limit)).Offset(max0(offset)).
		Find(&rows).Error
	if err != nil {
		return nil, 0, err
	}
	if len(rows) == 0 {
		return []model.Recipe{}, total, nil
	}
	ids := make([]uint64, 0, len(rows))
	pos := map[uint64]int{}
	for i, sr := range rows {
		id := sr.RecipeID
		ids = append(ids, id)
		pos[id] = i // сохранить порядок выдачи; при конфликте ключа брать более ранний индекс
	}
	var recipes []model.Recipe
	err = s.DB.
		Preload("Author").
		Preload("DishType").
		Preload("Difficulty").
		Preload("Tags").
		Where("id IN ?", ids).
		Find(&recipes).Error
	if err != nil {
		return nil, 0, err
	}
	slices.SortFunc(recipes, func(a, b model.Recipe) int {
		return pos[a.ID] - pos[b.ID]
	})
	return recipes, total, err
}
