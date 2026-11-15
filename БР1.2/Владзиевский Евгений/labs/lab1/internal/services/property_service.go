package services

import (
	"errors"
	"rental-api/internal/models"
	"rental-api/internal/repositories"
	"time"
)

type PropertyService interface {
	List(filters PropertyFilters) ([]models.Property, int64, error)
	GetByID(id uint) (*models.Property, error)
	Create(input PropertyInput, ownerID uint) (*models.Property, error)
	Update(id uint, input PropertyInput, userID uint, userRole string) (*models.Property, error)
	Delete(id uint, userID uint, userRole string) error
	UpdateStatus(id uint, status string, userID uint, userRole string) (*models.Property, error)
}

type propertyService struct {
	propertyRepo repositories.PropertyRepository
	userRepo     repositories.UserRepository
}

type PropertyInput struct {
	TypeID      uint     `json:"type_id"`
	Title       string   `json:"title"`
	Description *string  `json:"description,omitempty"`
	PricePerDay float64  `json:"price_per_day"`
	City        string   `json:"city"`
	Address     string   `json:"address"`
	Latitude    *float64 `json:"latitude,omitempty"`
	Longitude   *float64 `json:"longitude,omitempty"`
	AmenityIDs  []uint   `json:"amenity_ids,omitempty"`
}

type PropertyFilters struct {
	City      string     `form:"city"`
	TypeID    *uint      `form:"type_id"`
	MinPrice  *float64   `form:"min_price"`
	MaxPrice  *float64   `form:"max_price"`
	StartDate *time.Time `form:"start_date"`
	EndDate   *time.Time `form:"end_date"`
	Limit     int        `form:"limit"`
	Offset    int        `form:"offset"`
}

func NewPropertyService(propertyRepo repositories.PropertyRepository, userRepo repositories.UserRepository) PropertyService {
	return &propertyService{
		propertyRepo: propertyRepo,
		userRepo:     userRepo,
	}
}

func (s *propertyService) List(filters PropertyFilters) ([]models.Property, int64, error) {
	repoFilters := repositories.PropertyFilters{
		City:      filters.City,
		TypeID:    filters.TypeID,
		MinPrice:  filters.MinPrice,
		MaxPrice:  filters.MaxPrice,
		StartDate: filters.StartDate,
		EndDate:   filters.EndDate,
		Limit:     filters.Limit,
		Offset:    filters.Offset,
	}
	return s.propertyRepo.FindAllWithFilters(repoFilters)
}

func (s *propertyService) GetByID(id uint) (*models.Property, error) {
	return s.propertyRepo.FindByID(id)
}

func (s *propertyService) Create(input PropertyInput, ownerID uint) (*models.Property, error) {
	// Validate required fields
	if input.TypeID == 0 || input.Title == "" || input.PricePerDay <= 0 || input.City == "" || input.Address == "" {
		return nil, errors.New("missing or invalid required fields")
	}

	property := &models.Property{
		OwnerID:     ownerID,
		TypeID:      &input.TypeID,
		Title:       input.Title,
		Description: input.Description,
		PricePerDay: input.PricePerDay,
		City:        input.City,
		Address:     input.Address,
		Latitude:    input.Latitude,
		Longitude:   input.Longitude,
		Status:      "active",
	}

	if err := s.propertyRepo.Create(property); err != nil {
		return nil, err
	}
	if len(input.AmenityIDs) > 0 {
		amenities := make([]models.Amenity, 0, len(input.AmenityIDs))
		for _, id := range input.AmenityIDs {
			amenities = append(amenities, models.Amenity{ID: id})
		}
		property.Amenities = amenities
		if err := s.propertyRepo.Update(property); err != nil {
			return nil, err
		}
	}
	return property, nil
}

func (s *propertyService) Update(id uint, input PropertyInput, userID uint, userRole string) (*models.Property, error) {
	property, err := s.propertyRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("property not found")
	}

	// Authorization: only owner or admin can update
	if property.OwnerID != userID && userRole != "admin" {
		return nil, errors.New("forbidden")
	}

	// Update fields
	if input.TypeID != 0 {
		property.TypeID = &input.TypeID
	}
	if input.Title != "" {
		property.Title = input.Title
	}
	if input.Description != nil {
		property.Description = input.Description
	}
	if input.PricePerDay > 0 {
		property.PricePerDay = input.PricePerDay
	}
	if input.City != "" {
		property.City = input.City
	}
	if input.Address != "" {
		property.Address = input.Address
	}
	if input.Latitude != nil {
		property.Latitude = input.Latitude
	}
	if input.Longitude != nil {
		property.Longitude = input.Longitude
	}
	if input.AmenityIDs != nil {
		amenities := make([]models.Amenity, 0, len(input.AmenityIDs))
		for _, id := range input.AmenityIDs {
			amenities = append(amenities, models.Amenity{ID: id})
		}
		property.Amenities = amenities
	}

	if err := s.propertyRepo.Update(property); err != nil {
		return nil, err
	}
	return property, nil
}

func (s *propertyService) Delete(id uint, userID uint, userRole string) error {
	property, err := s.propertyRepo.FindByID(id)
	if err != nil {
		return errors.New("property not found")
	}
	if property.OwnerID != userID && userRole != "admin" {
		return errors.New("forbidden")
	}
	return s.propertyRepo.Delete(id)
}

func (s *propertyService) UpdateStatus(id uint, status string, userID uint, userRole string) (*models.Property, error) {
	if status != "active" && status != "archived" {
		return nil, errors.New("invalid status, must be 'active' or 'archived'")
	}
	property, err := s.propertyRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("property not found")
	}
	if property.OwnerID != userID && userRole != "admin" {
		return nil, errors.New("forbidden")
	}
	if err := s.propertyRepo.UpdateStatus(id, status); err != nil {
		return nil, err
	}
	property.Status = status
	return property, nil
}
