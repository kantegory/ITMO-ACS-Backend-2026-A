package database

import (
	"recipehub/internal/infrastructure/database/model"

	"gorm.io/gorm"
)

// commentDescendantsUnderRoots загружает ответы на корни во все глубину (батчами по уровню parent_comment_id).
func (s *Store) commentDescendantsUnderRoots(scope func(*gorm.DB) *gorm.DB, rootIDs []uint64) ([]model.Comment, error) {
	if len(rootIDs) == 0 {
		return nil, nil
	}
	seen := make(map[uint64]struct{}, len(rootIDs))
	for _, id := range rootIDs {
		seen[id] = struct{}{}
	}
	frontier := append([]uint64(nil), rootIDs...)
	var collected []model.Comment
	for len(frontier) > 0 {
		var batch []model.Comment
		q := scope(s.DB).Where("parent_comment_id IN ?", frontier).
			Preload("Author").
			Order("created_at ASC")
		if err := q.Find(&batch).Error; err != nil {
			return nil, err
		}
		frontier = frontier[:0]
		for _, c := range batch {
			collected = append(collected, c)
			if _, ok := seen[c.ID]; !ok {
				seen[c.ID] = struct{}{}
				frontier = append(frontier, c.ID)
			}
		}
	}
	return collected, nil
}

// CommentDescendantsUnderRootsForRecipe возвращает все нерутовые ответы в цепочках, начало которых в rootIDs (любая глубина вложенности).
func (s *Store) CommentDescendantsUnderRootsForRecipe(recipeID uint64, rootIDs []uint64) ([]model.Comment, error) {
	return s.commentDescendantsUnderRoots(func(db *gorm.DB) *gorm.DB {
		return db.Where("recipe_id = ? AND post_id IS NULL", recipeID)
	}, rootIDs)
}

// CommentDescendantsUnderRootsForPost то же для комментариев к посту.
func (s *Store) CommentDescendantsUnderRootsForPost(postID uint64, rootIDs []uint64) ([]model.Comment, error) {
	return s.commentDescendantsUnderRoots(func(db *gorm.DB) *gorm.DB {
		return db.Where("post_id = ? AND recipe_id IS NULL", postID)
	}, rootIDs)
}

func (s *Store) CommentsForRecipePaged(recipeID uint64, limit, offset int) ([]model.Comment, int64, error) {
	const cond = "recipe_id = ? AND post_id IS NULL AND parent_comment_id IS NULL"
	var total int64
	if err := s.DB.Model(&model.Comment{}).Where(cond, recipeID).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var roots []model.Comment
	err := s.DB.Where(cond, recipeID).
		Preload("Author").
		Order("created_at ASC").
		Limit(max1(limit)).Offset(max0(offset)).
		Find(&roots).Error
	return roots, total, err
}

func (s *Store) CommentsForPostPaged(postID uint64, limit, offset int) ([]model.Comment, int64, error) {
	const cond = "post_id = ? AND recipe_id IS NULL AND parent_comment_id IS NULL"
	var total int64
	if err := s.DB.Model(&model.Comment{}).Where(cond, postID).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var roots []model.Comment
	err := s.DB.Where(cond, postID).
		Preload("Author").
		Order("created_at ASC").
		Limit(max1(limit)).Offset(max0(offset)).
		Find(&roots).Error
	return roots, total, err
}

func (s *Store) PostExists(id uint64) bool {
	var c int64
	_ = s.DB.Model(&model.Post{}).Where("id = ?", id).Count(&c).Error
	return c > 0
}

func (s *Store) CommentByID(id uint64) (model.Comment, error) {
	var c model.Comment
	err := s.DB.First(&c, id).Error
	return c, err
}

// ReloadCommentWithAuthor подгружает комментарий с автором по первичному ключу (после Create).
func (s *Store) ReloadCommentWithAuthor(id uint64) (model.Comment, error) {
	var c model.Comment
	err := s.DB.Preload("Author").First(&c, id).Error
	return c, err
}

// DeleteCommentSubtree удаляет комментарий и все ответы в цепочке ниже него (сначала листья, затем предки).
func (s *Store) DeleteCommentSubtree(rootID uint64) error {
	return s.DB.Transaction(func(tx *gorm.DB) error {
		var levels [][]uint64
		frontier := []uint64{rootID}
		seen := map[uint64]struct{}{rootID: {}}
		for len(frontier) > 0 {
			levels = append(levels, frontier)
			var children []model.Comment
			if err := tx.Where("parent_comment_id IN ?", frontier).Find(&children).Error; err != nil {
				return err
			}
			frontier = frontier[:0]
			for _, ch := range children {
				if _, ok := seen[ch.ID]; ok {
					continue
				}
				seen[ch.ID] = struct{}{}
				frontier = append(frontier, ch.ID)
			}
		}
		for i := len(levels) - 1; i >= 0; i-- {
			for _, id := range levels[i] {
				if err := tx.Delete(&model.Comment{}, id).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func (s *Store) CreateComment(c *model.Comment) error {
	return s.DB.Create(c).Error
}
