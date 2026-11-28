package services

import (
	"context"
	"errors"

	"rental-platform/services/property-service/internal/clients"
	"rental-platform/services/property-service/internal/models"
	"rental-platform/services/property-service/internal/publishers"
	"rental-platform/services/property-service/internal/repository"

	"gorm.io/gorm"
)

var (
	ErrNotFound      = errors.New("not found")
	ErrForbidden     = errors.New("forbidden")
	ErrInvalidInput  = errors.New("invalid input")
	ErrConflict      = errors.New("conflict")
	ErrAmenityInUse  = errors.New("amenity in use")
)

type PropertyService struct {
	Properties *repository.PropertyRepository
	Amenities  *repository.AmenityRepository
	Images     *repository.ImageRepository
	Publisher  *publishers.PropertyPublisher
	Auth       *clients.AuthClient
}

type CreatePropertyInput struct {
	OwnerID       uint
	Title         string
	Description   string
	PropertyType  models.PropertyType
	City          string
	Address       string
	PricePerMonth int
	AmenityIDs    []uint
}

type UpdatePropertyInput struct {
	Title         *string
	Description   *string
	City          *string
	Address       *string
	PricePerMonth *int
	IsAvailable   *bool
	AmenityIDs    *[]uint
}

func (s *PropertyService) CreateProperty(ctx context.Context, input CreatePropertyInput) (*models.Property, error) {
	if !input.PropertyType.IsValid() {
		return nil, ErrInvalidInput
	}
	if input.PricePerMonth < 0 {
		return nil, ErrInvalidInput
	}

	amenities, err := s.resolveAmenities(input.AmenityIDs)
	if err != nil {
		return nil, err
	}

	property := &models.Property{
		OwnerID:       input.OwnerID,
		Title:         input.Title,
		Description:   input.Description,
		PropertyType:  input.PropertyType,
		City:          input.City,
		Address:       input.Address,
		PricePerMonth: input.PricePerMonth,
		IsVerified:    false,
		IsAvailable:   true,
		Amenities:     amenities,
	}

	if err := s.Properties.Create(property); err != nil {
		return nil, err
	}
	if err := s.Properties.Reload(property); err != nil {
		return nil, err
	}
	_ = s.Publisher.Created(ctx, property.ID, property.OwnerID)
	return property, nil
}

func (s *PropertyService) ListProperties(filter repository.PropertyListFilter) ([]models.Property, error) {
	return s.Properties.List(filter)
}

func (s *PropertyService) ListMyProperties(ownerID uint) ([]models.Property, error) {
	return s.Properties.ListByOwner(ownerID)
}

func (s *PropertyService) GetProperty(id uint) (*models.Property, error) {
	property, err := s.Properties.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return property, nil
}

func (s *PropertyService) GetPropertyInternal(id uint) (*models.Property, error) {
	property, err := s.Properties.FindInternalByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return property, nil
}

func (s *PropertyService) UpdateProperty(ctx context.Context, id, ownerID uint, input UpdatePropertyInput) (*models.Property, error) {
	property, err := s.Properties.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if property.OwnerID != ownerID {
		return nil, ErrForbidden
	}

	if input.Title != nil {
		property.Title = *input.Title
	}
	if input.Description != nil {
		property.Description = *input.Description
	}
	if input.City != nil {
		property.City = *input.City
	}
	if input.Address != nil {
		property.Address = *input.Address
	}
	if input.PricePerMonth != nil {
		if *input.PricePerMonth < 0 {
			return nil, ErrInvalidInput
		}
		property.PricePerMonth = *input.PricePerMonth
	}
	if input.IsAvailable != nil {
		property.IsAvailable = *input.IsAvailable
	}

	if err := s.Properties.Save(property); err != nil {
		return nil, err
	}

	if input.AmenityIDs != nil {
		amenities, err := s.resolveAmenities(*input.AmenityIDs)
		if err != nil {
			return nil, err
		}
		if err := s.Properties.ReplaceAmenities(property.ID, amenities); err != nil {
			return nil, err
		}
	}

	if err := s.Properties.Reload(property); err != nil {
		return nil, err
	}
	_ = s.Publisher.Updated(ctx, property.ID, property.OwnerID)
	return property, nil
}

func (s *PropertyService) DeleteProperty(ctx context.Context, id, ownerID uint) error {
	property, err := s.Properties.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return err
	}
	if property.OwnerID != ownerID {
		return ErrForbidden
	}

	owner := property.OwnerID
	propertyID := property.ID
	if err := s.Properties.Delete(id); err != nil {
		return err
	}
	_ = s.Publisher.Deleted(ctx, propertyID, owner)
	return nil
}

func (s *PropertyService) DeactivateByOwner(_ context.Context, ownerID uint) error {
	return s.Properties.SetAvailableByOwner(ownerID, false)
}

func (s *PropertyService) SetPropertyAvailability(_ context.Context, propertyID uint, available bool) error {
	_, err := s.Properties.FindInternalByID(propertyID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return err
	}
	return s.Properties.SetAvailable(propertyID, available)
}

func (s *PropertyService) ListImages(propertyID uint) ([]models.PropertyImage, error) {
	if _, err := s.Properties.FindInternalByID(propertyID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return s.Images.ListByProperty(propertyID)
}

func (s *PropertyService) AddImage(propertyID, ownerID uint, imageURL string) (*models.PropertyImage, error) {
	property, err := s.Properties.FindByID(propertyID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if property.OwnerID != ownerID {
		return nil, ErrForbidden
	}
	if imageURL == "" {
		return nil, ErrInvalidInput
	}

	image := &models.PropertyImage{
		PropertyID: propertyID,
		ImageURL:   imageURL,
	}
	if err := s.Images.Create(image); err != nil {
		return nil, err
	}
	return image, nil
}

func (s *PropertyService) DeleteImage(imageID, ownerID uint) error {
	image, err := s.Images.FindByID(imageID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return err
	}

	property, err := s.Properties.FindByID(image.PropertyID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return err
	}
	if property.OwnerID != ownerID {
		return ErrForbidden
	}

	return s.Images.Delete(imageID)
}

func (s *PropertyService) ListAmenities() ([]models.Amenity, error) {
	return s.Amenities.List()
}

func (s *PropertyService) CreateAmenity(name string) (*models.Amenity, error) {
	if name == "" {
		return nil, ErrInvalidInput
	}
	if existing, err := s.Amenities.FindByName(name); err == nil && existing != nil {
		return nil, ErrConflict
	} else if err != nil && !s.Amenities.IsNotFound(err) {
		return nil, err
	}

	amenity := &models.Amenity{Name: name}
	if err := s.Amenities.Create(amenity); err != nil {
		return nil, err
	}
	return amenity, nil
}

func (s *PropertyService) UpdateAmenity(id uint, name *string) (*models.Amenity, error) {
	amenity, err := s.Amenities.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if name != nil {
		if *name == "" {
			return nil, ErrInvalidInput
		}
		if existing, err := s.Amenities.FindByNameExcluding(*name, id); err == nil && existing != nil {
			return nil, ErrConflict
		} else if err != nil && !s.Amenities.IsNotFound(err) {
			return nil, err
		}
		amenity.Name = *name
	}
	if err := s.Amenities.Save(amenity); err != nil {
		return nil, err
	}
	return amenity, nil
}

func (s *PropertyService) DeleteAmenity(id uint) error {
	amenity, err := s.Amenities.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return err
	}

	count, err := s.Amenities.CountPropertyUsage(amenity.ID)
	if err != nil {
		return err
	}
	if count > 0 {
		return ErrAmenityInUse
	}

	return s.Amenities.Delete(id)
}

func (s *PropertyService) resolveAmenities(ids []uint) ([]models.Amenity, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	amenities, err := s.Amenities.FindByIDs(ids)
	if err != nil {
		return nil, err
	}
	if len(amenities) != len(ids) {
		return nil, ErrInvalidInput
	}
	return amenities, nil
}

func (s *PropertyService) LookupUser(ctx context.Context, userID uint) (*clients.UserInfo, error) {
	if s.Auth == nil {
		return nil, nil
	}
	return s.Auth.GetUser(ctx, userID)
}
