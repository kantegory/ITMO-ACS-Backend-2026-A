package database

import (
	"fmt"
	"log"
	
	"jobboard/internal/config"
	"jobboard/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB(cfg *config.Config) {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	DB = db

	err = autoMigrate(db)
	if err != nil {
		log.Fatalf("Failed to auto migrate: %v", err)
	}
}

func autoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.User{},
		&models.Company{},
		&models.Employer{},
		&models.JobSeeker{},
		&models.Resume{},
		&models.Skill{},
		&models.Education{},
		&models.Experience{},
		&models.Industry{},
		&models.Job{},
		&models.JobApplication{},
	)
}
