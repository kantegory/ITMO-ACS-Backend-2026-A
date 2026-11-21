package services

import (
	"errors"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"rental-api/internal/config"
	"rental-api/internal/models"
	"rental-api/internal/repositories"
	"strings"
	"time"
)

type PropertyImageService interface {
	Upload(propertyID uint, fileHeader *multipart.FileHeader, isMain bool, ownerID uint) (*models.PropertyImage, error)
	List(propertyID uint) ([]models.PropertyImage, error)
	Delete(imageID uint, ownerID uint) error
	SetMain(imageID uint, ownerID uint) (*models.PropertyImage, error)
}

type propertyImageService struct {
	imageRepo    repositories.PropertyImageRepository
	propertyRepo repositories.PropertyRepository
	cfg          *config.Config
}

func NewPropertyImageService(imageRepo repositories.PropertyImageRepository, propertyRepo repositories.PropertyRepository, cfg *config.Config) PropertyImageService {
	return &propertyImageService{
		imageRepo:    imageRepo,
		propertyRepo: propertyRepo,
		cfg:          cfg,
	}
}

func (s *propertyImageService) Upload(propertyID uint, fileHeader *multipart.FileHeader, isMain bool, ownerID uint) (*models.PropertyImage, error) {
	// Verify property exists and belongs to owner
	property, err := s.propertyRepo.FindByID(propertyID)
	if err != nil {
		return nil, errors.New("property not found")
	}
	if property.OwnerID != ownerID {
		return nil, errors.New("forbidden")
	}

	// Validate file size (max 10MB)
	if fileHeader.Size > 10*1024*1024 {
		return nil, errors.New("file size exceeds 10MB")
	}
	// Validate file extension
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true}
	if !allowed[ext] {
		return nil, errors.New("invalid file type, only images allowed")
	}

	// Generate unique filename
	filename := time.Now().Format("20060102150405") + "_" + fileHeader.Filename
	uploadPath := filepath.Join(s.cfg.UploadDir, filename)

	// Ensure upload directory exists
	if err := os.MkdirAll(s.cfg.UploadDir, 0755); err != nil {
		return nil, err
	}

	// Save file
	src, err := fileHeader.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	dst, err := os.Create(uploadPath)
	if err != nil {
		return nil, err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return nil, err
	}

	// Create image record
	imageURL := "/uploads/" + filename
	image := &models.PropertyImage{
		PropertyID: propertyID,
		ImageURL:   imageURL,
		IsMain:     isMain,
	}
	if isMain {
		// Ensure no other main image for this property (optional, we could handle in repository)
		// For simplicity, we'll just set this as main; the SetMain method can be called later.
	}
	if err := s.imageRepo.Create(image); err != nil {
		// Clean up file on DB error
		os.Remove(uploadPath)
		return nil, err
	}
	return image, nil
}

func (s *propertyImageService) List(propertyID uint) ([]models.PropertyImage, error) {
	return s.imageRepo.FindByPropertyID(propertyID)
}

func (s *propertyImageService) Delete(imageID uint, ownerID uint) error {
	image, err := s.imageRepo.FindByID(imageID)
	if err != nil {
		return errors.New("image not found")
	}
	property, err := s.propertyRepo.FindByID(image.PropertyID)
	if err != nil {
		return errors.New("property not found")
	}
	if property.OwnerID != ownerID {
		return errors.New("forbidden")
	}
	// Remove file from disk
	filePath := filepath.Join(s.cfg.UploadDir, filepath.Base(image.ImageURL))
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		// Log but continue
	}
	return s.imageRepo.Delete(imageID)
}

func (s *propertyImageService) SetMain(imageID uint, ownerID uint) (*models.PropertyImage, error) {
	image, err := s.imageRepo.FindByID(imageID)
	if err != nil {
		return nil, errors.New("image not found")
	}
	property, err := s.propertyRepo.FindByID(image.PropertyID)
	if err != nil {
		return nil, errors.New("property not found")
	}
	if property.OwnerID != ownerID {
		return nil, errors.New("forbidden")
	}
	if err := s.imageRepo.SetMain(imageID); err != nil {
		return nil, err
	}
	image.IsMain = true
	return image, nil
}
