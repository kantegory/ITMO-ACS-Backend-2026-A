package catalogrepo

import "gorm.io/gorm"

// AutoMigrate creates catalog tables owned by catalog-service.
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&dishTypeRow{},
		&difficultyRow{},
		&tagRow{},
		&ingredientRow{},
		&measurementUnitRow{},
	)
}
