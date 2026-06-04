package database

import (
	"errors"
	"strings"

	"recipehub/internal/infrastructure/database/model"
)

var ErrUnknownTagIDs = errors.New("unknown tag ids")

func dishTypeNorm(s string) string   { return strings.ToLower(strings.TrimSpace(s)) }
func ingredientNorm(s string) string { return strings.ToLower(strings.TrimSpace(s)) }

func (s *Store) DishTypes() ([]model.DishType, error) {
	var rows []model.DishType
	err := s.DB.Order("id ASC").Find(&rows).Error
	return rows, err
}

func (s *Store) DishTypeExistsName(name string) bool {
	key := dishTypeNorm(name)
	if key == "" {
		return false
	}
	var c int64
	_ = s.DB.Model(&model.DishType{}).Where("LOWER(TRIM(name)) = ?", key).Count(&c).Error
	return c > 0
}

func (s *Store) CreateDishType(name string) (model.DishType, error) {
	row := model.DishType{Name: strings.TrimSpace(name)}
	err := s.DB.Create(&row).Error
	return row, err
}

func tagNorm(s string) string { return strings.ToLower(strings.TrimSpace(s)) }

func (s *Store) TagExistsName(name string) bool {
	key := tagNorm(name)
	if key == "" {
		return false
	}
	var c int64
	_ = s.DB.Model(&model.Tag{}).Where("LOWER(TRIM(name)) = ?", key).Count(&c).Error
	return c > 0
}

func (s *Store) CreateTag(name string) (model.Tag, error) {
	row := model.Tag{Name: strings.TrimSpace(name)}
	err := s.DB.Create(&row).Error
	return row, err
}

func (s *Store) IngredientExistsName(name string) bool {
	key := ingredientNorm(name)
	if key == "" {
		return false
	}
	var c int64
	_ = s.DB.Model(&model.Ingredient{}).Where("LOWER(TRIM(name)) = ?", key).Count(&c).Error
	return c > 0
}

func (s *Store) CreateIngredient(name string) (model.Ingredient, error) {
	row := model.Ingredient{Name: strings.TrimSpace(name)}
	err := s.DB.Create(&row).Error
	return row, err
}

func (s *Store) Difficulties() ([]model.Difficulty, error) {
	var rows []model.Difficulty
	err := s.DB.Order("id ASC").Find(&rows).Error
	return rows, err
}

func (s *Store) Tags() ([]model.Tag, error) {
	var rows []model.Tag
	err := s.DB.Order("id ASC").Find(&rows).Error
	return rows, err
}

func (s *Store) TagsByIDs(ids []uint64) ([]model.Tag, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	var rows []model.Tag
	err := s.DB.Where("id IN ?", ids).Find(&rows).Error
	return rows, err
}

func (s *Store) IngredientsByIDs(ids []uint64) ([]model.Ingredient, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	var rows []model.Ingredient
	err := s.DB.Where("id IN ?", ids).Find(&rows).Error
	return rows, err
}

func (s *Store) IngredientExists(id uint64) bool {
	var c int64
	_ = s.DB.Model(&model.Ingredient{}).Where("id = ?", id).Count(&c).Error
	return c > 0
}

func (s *Store) MeasurementUnitExists(id uint64) bool {
	var c int64
	_ = s.DB.Model(&model.MeasurementUnit{}).Where("id = ?", id).Count(&c).Error
	return c > 0
}

func (s *Store) DishTypeExists(id uint64) bool {
	var c int64
	_ = s.DB.Model(&model.DishType{}).Where("id = ?", id).Count(&c).Error
	return c > 0
}

func (s *Store) DifficultyExists(id uint64) bool {
	var c int64
	_ = s.DB.Model(&model.Difficulty{}).Where("id = ?", id).Count(&c).Error
	return c > 0
}

func (s *Store) ResolveTags(uniqueIDs []uint64) ([]model.Tag, error) {
	if len(uniqueIDs) == 0 {
		return []model.Tag{}, nil
	}
	tags, err := s.TagsByIDs(uniqueIDs)
	if err != nil {
		return nil, err
	}
	if len(tags) != len(uniqueIDs) {
		return nil, ErrUnknownTagIDs
	}
	return tags, nil
}
