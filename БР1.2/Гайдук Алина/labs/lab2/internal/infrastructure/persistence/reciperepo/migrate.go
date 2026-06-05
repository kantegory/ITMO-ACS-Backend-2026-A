package reciperepo

import "gorm.io/gorm"

// AutoMigrate creates recipe tables owned by recipe-service.
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&recipeRow{},
		&stepRow{},
		&ingredientRow{},
		&tagRow{},
		&recipeStatsRow{},
		&processedEventRow{},
	)
}
