package services

import (
	"errors"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"property-service/internal/client"
	"property-service/internal/config"
	"property-service/internal/models"
	"property-service/internal/repositories"
	"strings"
	"time"
)

type PropertyImageService interface {
	Upload(propertyID uint, fileHeader *multipart.FileHeader, isMain bool, userID uint) (*models.PropertyImage, error)
	List(propertyID uint) ([]models.PropertyImage, error)
	Delete(imageID uint, userID uint) error
	SetMain(imageID uint, userID uint) (*models.PropertyImage, error)
}

type propertyImageService struct {
	imageRepo    repositories.PropertyImageRepository
	propertyRepo repositories.PropertyRepository
	authClient   *client.AuthClient
	cfg          *config.Config
}

func NewPropertyImageService(
	imageRepo repositories.PropertyImageRepository,
	propertyRepo repositories.PropertyRepository,
	authClient *client.AuthClient,
	cfg *config.Config,
) PropertyImageService {
	return &propertyImageService{
		imageRepo:    imageRepo,
		propertyRepo: propertyRepo,
		authClient:   authClient,
		cfg:          cfg,
	}
}

func (s *propertyImageService) Upload(propertyID uint, fileHeader *multipart.FileHeader, isMain bool, userID uint) (*models.PropertyImage, error) {
	property, err := s.propertyRepo.FindByID(propertyID)
	if err != nil {
		return nil, errors.New("property not found")
	}

	if property.OwnerID != userID {
		isOwnerOrAdmin, _, err := s.authClient.CheckOwnership(userID)
		if err != nil || !isOwnerOrAdmin {
			return nil, errors.New("forbidden")
		}
		if property.OwnerID != userID {
			return nil, errors.New("forbidden")
		}
	}

	if fileHeader.Size > s.cfg.MaxUploadSize {
		return nil, errors.New("file size exceeds maximum allowed size")
	}

	contentType := fileHeader.Header.Get("Content-Type")
	allowed := false
	for _, t := range s.cfg.AllowedImageTypes {
		if t == contentType {
			allowed = true
			break
		}
	}
	if !allowed {
		ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
		extAllowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true}
		if !extAllowed[ext] {
			return nil, errors.New("invalid file type, only images allowed")
		}
	}

	filename := time.Now().Format("20060102150405") + "_" + fileHeader.Filename
	uploadPath := filepath.Join(s.cfg.UploadDir, filename)

	if err := os.MkdirAll(s.cfg.UploadDir, 0755); err != nil {
		return nil, err
	}

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

	imageURL := "/uploads/" + filename
	image := &models.PropertyImage{
		PropertyID: propertyID,
		ImageURL:   imageURL,
		IsMain:     isMain,
	}
	if err := s.imageRepo.Create(image); err != nil {
		os.Remove(uploadPath)
		return nil, err
	}
	return image, nil
}

func (s *propertyImageService) List(propertyID uint) ([]models.PropertyImage, error) {
	return s.imageRepo.FindByPropertyID(propertyID)
}

func (s *propertyImageService) Delete(imageID uint, userID uint) error {
	image, err := s.imageRepo.FindByID(imageID)
	if err != nil {
		return errors.New("image not found")
	}
	property, err := s.propertyRepo.FindByID(image.PropertyID)
	if err != nil {
		return errors.New("property not found")
	}
	if property.OwnerID != userID {
		isOwnerOrAdmin, _, chkErr := s.authClient.CheckOwnership(userID)
		if chkErr != nil || !isOwnerOrAdmin {
			return errors.New("forbidden")
		}
		if property.OwnerID != userID {
			return errors.New("forbidden")
		}
	}

	filePath := filepath.Join(s.cfg.UploadDir, filepath.Base(image.ImageURL))
	os.Remove(filePath)

	return s.imageRepo.Delete(imageID)
}

func (s *propertyImageService) SetMain(imageID uint, userID uint) (*models.PropertyImage, error) {
	image, err := s.imageRepo.FindByID(imageID)
	if err != nil {
		return nil, errors.New("image not found")
	}
	property, err := s.propertyRepo.FindByID(image.PropertyID)
	if err != nil {
		return nil, errors.New("property not found")
	}
	if property.OwnerID != userID {
		isOwnerOrAdmin, _, chkErr := s.authClient.CheckOwnership(userID)
		if chkErr != nil || !isOwnerOrAdmin {
			return nil, errors.New("forbidden")
		}
		if property.OwnerID != userID {
			return nil, errors.New("forbidden")
		}
	}

	if err := s.imageRepo.SetMain(imageID); err != nil {
		return nil, err
	}
	image.IsMain = true
	return image, nil
}