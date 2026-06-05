package identityrepo

import "gorm.io/gorm"

// AutoMigrate creates identity tables owned by identity-service.
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&userRow{},
		&refreshTokenRow{},
		&followRow{},
	)
}
