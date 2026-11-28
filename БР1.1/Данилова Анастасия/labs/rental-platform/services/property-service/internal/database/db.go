package database

import (
	"log"

	"rental-platform/services/property-service/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect(dbURL string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}
	if err := db.AutoMigrate(
		&models.Property{},
		&models.Amenity{},
		&models.PropertyAmenity{},
		&models.PropertyImage{},
	); err != nil {
		log.Fatalf("failed to migrate: %v", err)
	}
	return db
}
