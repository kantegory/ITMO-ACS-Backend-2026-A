package database

import (
	"fmt"
	"log"
	"rental-api/internal/config"
	"rental-api/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(cfg *config.Config) error {
	dsn := cfg.DSN()
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	DB = db
	log.Println("Connected to database successfully")
	return nil
}

func AutoMigrate() error {
	if DB == nil {
		return fmt.Errorf("database connection not initialized")
	}

	err := DB.AutoMigrate(
		&models.PropertyType{},
		&models.Amenity{},
		&models.User{},
		&models.Property{},
		&models.PropertyImage{},
		&models.Rental{},
		&models.Message{},
		&models.Transaction{},
	)
	if err != nil {
		return fmt.Errorf("failed to auto migrate: %w", err)
	}
	log.Println("Database migration completed")
	return nil
}

func GetDB() *gorm.DB {
	return DB
}
