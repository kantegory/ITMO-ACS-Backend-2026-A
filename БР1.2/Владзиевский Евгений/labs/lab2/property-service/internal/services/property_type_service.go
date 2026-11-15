package services

import (
	"errors"
	"property-service/internal/models"
	"property-service/internal/repositories"
)

type PropertyTypeService interface {
	List() ([]models.PropertyType, error)
	Create(name string) (*models.PropertyType, error)
}

type propertyTypeService struct {
	repo repositories.PropertyTypeRepository
}

func NewPropertyTypeService(repo repositories.PropertyTypeRepository) PropertyTypeService {
	return &propertyTypeService{repo: repo}
}

func (s *propertyTypeService) List() ([]models.PropertyType, error) {
	return s.repo.FindAll()
}

func (s *propertyTypeService) Create(name string) (*models.PropertyType, error) {
	if len(name) == 0 || len(name) > 50 {
		return nil, errors.New("name must be between 1 and 50 characters")
	}

	existing, err := s.repo.FindByName(name)
	if err == nil && existing != nil {
		return nil, errors.New("property type with this name already exists")
	}

	pt := &models.PropertyType{Name: name}
	if err := s.repo.Create(pt); err != nil {
		return nil, err
	}
	return pt, nil
}