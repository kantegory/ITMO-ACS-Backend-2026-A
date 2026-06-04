package engagementrepo

import "gorm.io/gorm"

// AutoMigrate creates engagement tables owned by engagement-service.
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&commentRow{},
		&recipeLikeRow{},
		&postLikeRow{},
		&savedRecipeRow{},
	)
}
