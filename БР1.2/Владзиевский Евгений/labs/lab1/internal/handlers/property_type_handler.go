package handlers

import (
	"net/http"
	"rental-api/internal/config"
	"rental-api/internal/repositories"
	"rental-api/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type PropertyTypeHandler struct {
	propertyTypeService services.PropertyTypeService
	cfg                 *config.Config
	validate            *validator.Validate
}

func NewPropertyTypeHandler(cfg *config.Config) *PropertyTypeHandler {
	repo := repositories.NewPropertyTypeRepository()
	service := services.NewPropertyTypeService(repo)
	return &PropertyTypeHandler{
		propertyTypeService: service,
		cfg:                 cfg,
		validate:            validator.New(),
	}
}

// PropertyTypeCreateRequest matches OpenAPI schema for POST /property-types
type PropertyTypeCreateRequest struct {
	Name string `json:"name" binding:"required,max=50"`
}

// PropertyTypeResponse matches OpenAPI schema PropertyType (id, name)
type PropertyTypeResponse struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

func (h *PropertyTypeHandler) List(c *gin.Context) {
	propertyTypes, err := h.propertyTypeService.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to retrieve property types",
				"details": err.Error(),
			},
		})
		return
	}

	// Convert models to response
	response := make([]PropertyTypeResponse, len(propertyTypes))
	for i, pt := range propertyTypes {
		response[i] = PropertyTypeResponse{
			ID:   pt.ID,
			Name: pt.Name,
		}
	}
	c.JSON(http.StatusOK, response)
}

func (h *PropertyTypeHandler) Create(c *gin.Context) {
	var req PropertyTypeCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request format",
				"details": err.Error(),
			},
		})
		return
	}

	// Validate using validator
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Validation failed",
				"details": err.Error(),
			},
		})
		return
	}

	propertyType, err := h.propertyTypeService.Create(req.Name)
	if err != nil {
		// Determine appropriate status code based on error message
		status := http.StatusBadRequest
		if err.Error() == "property type with this name already exists" {
			status = http.StatusConflict
		}
		c.JSON(status, gin.H{
			"error": gin.H{
				"code":    "CREATE_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, PropertyTypeResponse{
		ID:   propertyType.ID,
		Name: propertyType.Name,
	})
}
