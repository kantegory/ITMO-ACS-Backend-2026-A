package database

import (
	"log"
	"property-service/internal/config"
	"property-service/internal/models"

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
	return DB.AutoMigrate(
		&models.PropertyType{},
		&models.Amenity{},
		&models.Property{},
		&models.PropertyImage{},
		&models.OutboxEvent{},
	)
}

func SeedData() {
	var count int64
	DB.Model(&models.PropertyType{}).Count(&count)
	if count == 0 {
		types := []models.PropertyType{
			{Name: "Квартира"},
			{Name: "Дом"},
			{Name: "Студия"},
			{Name: "Офис"},
		}
		for _, pt := range types {
			DB.Create(&pt)
		}
		log.Printf("Seeded %d property types", len(types))
	}

	DB.Model(&models.Amenity{}).Count(&count)
	if count == 0 {
		wifiIcon := "wifi"
		wifiDesc := "Бесплатный Wi-Fi"
		carIcon := "car"
		carDesc := "Бесплатная парковка"
		snowIcon := "snow"
		snowDesc := "Кондиционер в каждой комнате"
		kitchenIcon := "kitchen"
		kitchenDesc := "Полностью оборудованная кухня"
		amenities := []models.Amenity{
			{Name: "Wi-Fi", Icon: &wifiIcon, Description: &wifiDesc},
			{Name: "Парковка", Icon: &carIcon, Description: &carDesc},
			{Name: "Кондиционер", Icon: &snowIcon, Description: &snowDesc},
			{Name: "Кухня", Icon: &kitchenIcon, Description: &kitchenDesc},
		}
		for _, a := range amenities {
			DB.Create(&a)
		}
		log.Printf("Seeded %d amenities", len(amenities))
	}
}

func GetDB() *gorm.DB {
	return DB
}