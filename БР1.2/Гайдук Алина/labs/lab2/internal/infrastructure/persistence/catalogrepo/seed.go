package catalogrepo

import (
	"context"
	"fmt"

	"gorm.io/gorm"
)

// SeedDefaults inserts initial catalog reference data.
func SeedDefaults(ctx context.Context, db *gorm.DB) error {
	var count int64
	if err := db.WithContext(ctx).Model(&dishTypeRow{}).Count(&count).Error; err != nil {
		return fmt.Errorf("count dish types: %w", err)
	}
	if count > 0 {
		return nil
	}

	if err := db.WithContext(ctx).Create(&[]dishTypeRow{
		{Name: "Soup"},
		{Name: "Salad"},
		{Name: "Main course"},
		{Name: "Dessert"},
		{Name: "Appetizer"},
		{Name: "Drink"},
	}).Error; err != nil {
		return fmt.Errorf("seed dish types: %w", err)
	}

	if err := db.WithContext(ctx).Create(&[]difficultyRow{
		{Name: "Easy"},
		{Name: "Medium"},
		{Name: "Hard"},
	}).Error; err != nil {
		return fmt.Errorf("seed difficulties: %w", err)
	}

	if err := db.WithContext(ctx).Create(&[]measurementUnitRow{
		{Name: "gram", ShortName: "g"},
		{Name: "milliliter", ShortName: "ml"},
		{Name: "piece", ShortName: "pc"},
		{Name: "tablespoon", ShortName: "tbsp"},
		{Name: "teaspoon", ShortName: "tsp"},
	}).Error; err != nil {
		return fmt.Errorf("seed measurement units: %w", err)
	}

	if err := db.WithContext(ctx).Create(&[]tagRow{
		{Name: "vegetarian"},
		{Name: "quick"},
		{Name: "kids"},
		{Name: "low calorie"},
	}).Error; err != nil {
		return fmt.Errorf("seed tags: %w", err)
	}

	if err := db.WithContext(ctx).Create(&[]ingredientRow{
		{Name: "Tomatoes"},
		{Name: "Onion"},
		{Name: "Garlic"},
		{Name: "Flour"},
		{Name: "Eggs"},
		{Name: "Milk"},
		{Name: "Parmesan"},
		{Name: "Bacon"},
		{Name: "Spaghetti"},
		{Name: "Olive oil"},
	}).Error; err != nil {
		return fmt.Errorf("seed ingredients: %w", err)
	}

	return nil
}
