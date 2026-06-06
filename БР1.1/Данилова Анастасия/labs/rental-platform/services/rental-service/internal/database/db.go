package database

import (
	"log"

	"rental-platform/services/rental-service/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect(dbURL string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}
	if err := db.AutoMigrate(&models.Rental{}); err != nil {
		log.Fatalf("failed to migrate: %v", err)
	}
	return db
}
