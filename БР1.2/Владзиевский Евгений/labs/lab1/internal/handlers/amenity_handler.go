package handlers

import (
	"net/http"
	"rental-api/internal/config"
	"rental-api/internal/repositories"
	"rental-api/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type AmenityHandler struct {
	amenityService services.AmenityService
	cfg            *config.Config
	validate       *validator.Validate
}

func NewAmenityHandler(cfg *config.Config) *AmenityHandler {
	amenityRepo := repositories.NewAmenityRepository()
	amenityService := services.NewAmenityService(amenityRepo)
	return &AmenityHandler{
		amenityService: amenityService,
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to retrieve amenities", "details": err.Error()}})
		return
	}
	c.JSON(http.StatusOK, amenities)
}

func (h *AmenityHandler) Create(c *gin.Context) {
	var req AmenityCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": "Invalid request format", "details": err.Error()}})
		return
	}
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": "Validation failed", "details": err.Error()}})
		return
	}
	amenity, err := h.amenityService.Create(req.Name, req.Icon, req.Description)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "CREATE_ERROR", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusCreated, amenity)
}

func (h *AmenityHandler) Delete(c *gin.Context) {
	// placeholder until route wiring is added
	c.Status(http.StatusNotImplemented)
}
