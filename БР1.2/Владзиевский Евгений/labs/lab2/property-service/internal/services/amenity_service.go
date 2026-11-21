package services

import (
	"errors"
	"property-service/internal/models"
	"property-service/internal/repositories"
)

type AmenityService interface {
	List() ([]models.Amenity, error)
	Create(name string, icon *string, description *string) (*models.Amenity, error)
	Delete(id uint) error
}

type amenityService struct {
	amenityRepo repositories.AmenityRepository
}

func NewAmenityService(amenityRepo repositories.AmenityRepository) AmenityService {
	return &amenityService{amenityRepo: amenityRepo}
}

func (s *amenityService) List() ([]models.Amenity, error) {
	return s.amenityRepo.FindAll()
}

func (s *amenityService) Create(name string, icon *string, description *string) (*models.Amenity, error) {
	if name == "" {
		return nil, errors.New("name is required")
	}

	amenity := &models.Amenity{
		Name:        name,
		Icon:        icon,
		Description: description,
	}
	if err := s.amenityRepo.Create(amenity); err != nil {
		return nil, err
	}
	return amenity, nil
}

func (s *amenityService) Delete(id uint) error {
	_, err := s.amenityRepo.FindByID(id)
	if err != nil {
		return errors.New("amenity not found")
	}
	return s.amenityRepo.Delete(id)
}