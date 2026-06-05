package database

import (
	"strings"

	"recipehub/internal/infrastructure/database/model"

	"gorm.io/gorm"
)

type PostPage struct {
	Posts []model.Post
	Total int64
}

func (s *Store) PostByID(id uint64) (*model.Post, error) {
	var p model.Post
	err := s.DB.Preload("Author").First(&p, id).Error
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (s *Store) CreatePost(p *model.Post) error {
	return s.DB.Create(p).Error
}

func (s *Store) SavePost(p *model.Post) error {
	return s.DB.Save(p).Error
}

func (s *Store) DeletePost(id uint64) error {
	return s.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("post_id = ?", id).Delete(&model.Comment{}).Error; err != nil {
			return err
		}
		if err := tx.Where("post_id = ?", id).Delete(&model.PostLike{}).Error; err != nil {
			return err
		}
		return tx.Delete(&model.Post{}, id).Error
	})
}

func (s *Store) ListPosts(limit, offset int) (PostPage, error) {
	var total int64
	if err := s.DB.Model(&model.Post{}).Count(&total).Error; err != nil {
		return PostPage{}, err
	}
	var posts []model.Post
	err := s.DB.Preload("Author").
		Order("created_at DESC").
		Limit(max1(limit)).
		Offset(max0(offset)).
		Find(&posts).Error
	return PostPage{Posts: posts, Total: total}, err
}

func (s *Store) ListPostsByAuthor(authorID uint64, limit, offset int) (PostPage, error) {
	var total int64
	if err := s.DB.Model(&model.Post{}).Where("author_id = ?", authorID).Count(&total).Error; err != nil {
		return PostPage{}, err
	}
	var posts []model.Post
	err := s.DB.Where("author_id = ?", authorID).
		Preload("Author").
		Order("created_at DESC").
		Limit(max1(limit)).
		Offset(max0(offset)).
		Find(&posts).Error
	return PostPage{Posts: posts, Total: total}, err
}

func (s *Store) SearchIngredients(q string, limit int) ([]model.Ingredient, error) {
	q = strings.TrimSpace(q)
	dbq := s.DB.Model(&model.Ingredient{}).Limit(max1(limit))
	if q != "" {
		dbq = dbq.Where("LOWER(name) LIKE ?", "%"+strings.ToLower(q)+"%")
	}
	var rows []model.Ingredient
	err := dbq.Order("name ASC").Find(&rows).Error
	return rows, err
}
