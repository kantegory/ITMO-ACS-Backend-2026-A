package database

import (
	"fmt"
	"log/slog"
	"strings"

	"recipehub/internal/config"
	"recipehub/internal/infrastructure/database/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Open(cfg config.Config) (*gorm.DB, error) {
	url := strings.TrimSpace(cfg.DatabaseURL)
	if url == "" {
		return nil, fmt.Errorf("DATABASE_URL пустой: задайте строку PostgreSQL или используйте значение по умолчанию в config.Load()")
	}
	db, err := gorm.Open(postgres.Open(url), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return nil, err
	}

	if err := db.AutoMigrate(
		&model.User{},
		&model.RefreshToken{},
		&model.DishType{},
		&model.Difficulty{},
		&model.Tag{},
		&model.Ingredient{},
		&model.MeasurementUnit{},
		&model.Recipe{},
		&model.RecipeStep{},
		&model.RecipeIngredient{},
		&model.Post{},
		&model.Comment{},
		&model.RecipeLike{},
		&model.PostLike{},
		&model.Follow{},
		&model.SavedRecipe{},
	); err != nil {
		return nil, err
	}

	if err := seedReferences(db); err != nil {
		return nil, err
	}

	return db, nil
}

func seedReferences(db *gorm.DB) error {
	var n int64
	if err := db.Model(&model.DishType{}).Count(&n).Error; err != nil {
		return err
	}
	if n > 0 {
		return nil
	}

	slog.Info("seeding reference data")

	dishTypes := []model.DishType{
		{Name: "Суп"}, {Name: "Салат"}, {Name: "Горячее"},
		{Name: "Десерт"}, {Name: "Закуска"}, {Name: "Напиток"},
	}
	if err := db.Create(&dishTypes).Error; err != nil {
		return err
	}

	difficulties := []model.Difficulty{
		{Name: "Лёгкая"}, {Name: "Средняя"}, {Name: "Сложная"},
	}
	if err := db.Create(&difficulties).Error; err != nil {
		return err
	}

	units := []model.MeasurementUnit{
		{Name: "грамм", ShortName: "г"},
		{Name: "миллилитр", ShortName: "мл"},
		{Name: "штука", ShortName: "шт"},
		{Name: "столовая ложка", ShortName: "ст. л."},
		{Name: "чайная ложка", ShortName: "ч. л."},
	}
	if err := db.Create(&units).Error; err != nil {
		return err
	}

	tags := []model.Tag{
		{Name: "вегетарианское"},
		{Name: "быстро"},
		{Name: "для детей"},
		{Name: "низкокалорийное"},
	}
	if err := db.Create(&tags).Error; err != nil {
		return err
	}

	ingredients := []model.Ingredient{
		{Name: "Томаты"}, {Name: "Лук"}, {Name: "Чеснок"}, {Name: "Мука"},
		{Name: "Яйца"}, {Name: "Молоко"}, {Name: "Сыр пармезан"}, {Name: "Бекон"},
		{Name: "Спагетти"}, {Name: "Оливковое масло"},
	}
	return db.Create(&ingredients).Error
}
