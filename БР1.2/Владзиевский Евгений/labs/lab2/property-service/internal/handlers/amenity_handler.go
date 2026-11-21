package handlers

import (
	"net/http"
	"property-service/internal/config"
	"property-service/internal/repositories"
	amenityService "property-service/internal/services"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type AmenityHandler struct {
	amenityService amenityService.AmenityService
	cfg            *config.Config
	validate       *validator.Validate
}

func NewAmenityHandler(cfg *config.Config) *AmenityHandler {
	amenityRepo := repositories.NewAmenityRepository()
	svc := amenityService.NewAmenityService(amenityRepo)
	return &AmenityHandler{
		amenityService: svc,
		cfg:            cfg,
		validate:       validator.New(),
	}
}

type AmenityCreateRequest struct {
	Name        string  `json:"name" binding:"required,max=100"`
	Icon        *string `json:"icon,omitempty"`
	Description *string `json:"description,omitempty"`
}

func (h *AmenityHandler) List(c *gin.Context) {
	amenities, err := h.amenityService.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to retrieve amenities", "details": err.Error()},
		})
		return
	}
	c.JSON(http.StatusOK, amenities)
}

func (h *AmenityHandler) Create(c *gin.Context) {
	var req AmenityCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "Invalid request format", "details": err.Error()},
		})
		return
	}
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "Validation failed", "details": err.Error()},
		})
		return
	}
	amenity, err := h.amenityService.Create(req.Name, req.Icon, req.Description)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "CREATE_ERROR", "message": err.Error()},
		})
		return
	}
	c.JSON(http.StatusCreated, amenity)
}

func (h *AmenityHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "Invalid amenity ID"},
		})
		return
	}

	err = h.amenityService.Delete(uint(id))
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "amenity not found" {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{
			"error": gin.H{"code": "DELETE_ERROR", "message": err.Error()},
		})
		return
	}
	c.Status(http.StatusNoContent)
}