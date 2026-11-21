package services

import (
	"errors"
	"rental-api/internal/models"
	"rental-api/internal/repositories"
)

type PropertyTypeService interface {
	List() ([]models.PropertyType, error)
	Create(name string) (*models.PropertyType, error)
	GetByID(id uint) (*models.PropertyType, error)
	Update(id uint, name string) (*models.PropertyType, error)
	Delete(id uint) error
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
	// Validate name length (max 50 per schema)
	if len(name) == 0 || len(name) > 50 {
		return nil, errors.New("name must be between 1 and 50 characters")
	}

	// Check for duplicate name
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

func (s *propertyTypeService) GetByID(id uint) (*models.PropertyType, error) {
	return s.repo.FindByID(id)
}

func (s *propertyTypeService) Update(id uint, name string) (*models.PropertyType, error) {
	pt, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("property type not found")
	}
	if len(name) == 0 || len(name) > 50 {
		return nil, errors.New("name must be between 1 and 50 characters")
	}
	// Check duplicate name for other records
	existing, err := s.repo.FindByName(name)
	if err == nil && existing != nil && existing.ID != id {
		return nil, errors.New("property type with this name already exists")
	}
	pt.Name = name
	if err := s.repo.Update(pt); err != nil {
		return nil, err
	}
	return pt, nil
}

func (s *propertyTypeService) Delete(id uint) error {
	return s.repo.Delete(id)
}
