package database

import (
	"auth-service/internal/config"
	"auth-service/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect(cfg *config.Config) error {
	var err error
	DB, err = gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{})
	if err != nil {
		return err
	}
	return nil
}

func AutoMigrate() error {
	return DB.AutoMigrate(&models.User{}, &models.OutboxEvent{})
}