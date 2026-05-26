package database

import (
	"fmt"
	"log"
	"resume-service/internal/config"
	"resume-service/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB(cfg *config.Config) {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	err = DB.AutoMigrate(&models.Resume{}, &models.Skill{}, &models.Education{}, &models.Experience{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}
}
