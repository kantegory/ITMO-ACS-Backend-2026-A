package engagementrepo

import "gorm.io/gorm"

// AutoMigrate creates engagement tables owned by engagement-service.
func AutoMigrate(db *gorm.DB) error {
	if err := db.AutoMigrate(
		&commentRow{},
		&recipeLikeRow{},
		&postLikeRow{},
		&savedRecipeRow{},
		&outboxEventRow{},
	); err != nil {
		return err
	}

	return db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_outbox_events_pending
		ON outbox_events (created_at ASC)
		WHERE published_at IS NULL
	`).Error
}
