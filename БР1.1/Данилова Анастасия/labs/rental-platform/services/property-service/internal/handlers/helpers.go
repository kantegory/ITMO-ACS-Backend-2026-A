package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"rental-platform/services/property-service/internal/models"
	"rental-platform/services/property-service/internal/services"

	"github.com/gin-gonic/gin"
)

func parseUintParam(c *gin.Context, name string) (uint, error) {
	v, err := strconv.ParseUint(c.Param(name), 10, 64)
	if err != nil || v == 0 {
		return 0, errors.New("invalid id")
	}
	return uint(v), nil
}

func parseUintQueryArray(c *gin.Context, key string) ([]uint, error) {
	values := c.QueryArray(key)
	if len(values) == 0 {
		if single := c.Query(key); single != "" {
			values = []string{single}
		}
	}
	if len(values) == 0 {
		return nil, nil
	}

	ids := make([]uint, 0, len(values))
	for _, v := range values {
		n, err := strconv.ParseUint(v, 10, 64)
		if err != nil || n == 0 {
			return nil, errors.New("invalid value")
		}
		ids = append(ids, uint(n))
	}
	return ids, nil
}

func writeServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, services.ErrNotFound):
		c.JSON(http.StatusNotFound, gin.H{"message": "not found"})
	case errors.Is(err, services.ErrForbidden):
		c.JSON(http.StatusForbidden, gin.H{"message": "forbidden"})
	case errors.Is(err, services.ErrConflict):
		c.JSON(http.StatusConflict, gin.H{"message": "already exists"})
	case errors.Is(err, services.ErrAmenityInUse):
		c.JSON(http.StatusConflict, gin.H{"message": "amenity is used by properties"})
	case errors.Is(err, services.ErrInvalidInput):
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid input"})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"message": "internal error"})
	}
}

func toAmenityResponse(a models.Amenity) amenityResponse {
	return amenityResponse{
		ID:   a.ID,
		Name: a.Name,
	}
}

type propertyImageResponse struct {
	ID         uint   `json:"id"`
	PropertyID uint   `json:"property_id"`
	ImageURL   string `json:"image_url"`
}

func toPropertyImageResponse(img models.PropertyImage) propertyImageResponse {
	return propertyImageResponse{
		ID:         img.ID,
		PropertyID: img.PropertyID,
		ImageURL:   img.ImageURL,
	}
}
