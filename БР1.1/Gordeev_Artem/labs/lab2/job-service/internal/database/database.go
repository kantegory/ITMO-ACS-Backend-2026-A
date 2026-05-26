package database

import (
	"fmt"
	"job-service/internal/config"
	"job-service/internal/models"
	"log"

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

	err = DB.AutoMigrate(&models.Industry{}, &models.Job{}, &models.JobApplication{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	seedIndustries()
}

func seedIndustries() {
	var count int64
	DB.Model(&models.Industry{}).Count(&count)
	if count == 0 {
		industries := []models.Industry{
			{Name: "ИТ"},
			{Name: "Финансы"},
			{Name: "Здравоохранение"},
			{Name: "Образование"},
			{Name: "Производство"},
		}
		if err := DB.Create(&industries).Error; err != nil {
			log.Printf("Failed to seed industries: %v", err)
		} else {
			log.Println("Successfully seeded industries")
		}
	}
}
