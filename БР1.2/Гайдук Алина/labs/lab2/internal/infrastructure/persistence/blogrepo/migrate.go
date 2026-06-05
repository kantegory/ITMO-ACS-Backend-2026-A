package blogrepo

import "gorm.io/gorm"

// AutoMigrate creates blog tables owned by blog-service.
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&postRow{}, &postStatsRow{}, &processedEventRow{})
}
