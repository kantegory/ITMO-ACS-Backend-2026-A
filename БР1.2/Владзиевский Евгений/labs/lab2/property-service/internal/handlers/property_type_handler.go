package handlers

import (
	"net/http"
	"property-service/internal/config"
	propertyTypeService "property-service/internal/services"
	"property-service/internal/repositories"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type PropertyTypeHandler struct {
	propertyTypeService propertyTypeService.PropertyTypeService
	cfg                 *config.Config
	validate            *validator.Validate
}

func NewPropertyTypeHandler(cfg *config.Config) *PropertyTypeHandler {
	repo := repositories.NewPropertyTypeRepository()
	svc := propertyTypeService.NewPropertyTypeService(repo)
	return &PropertyTypeHandler{
		propertyTypeService: svc,
		cfg:                 cfg,
		validate:            validator.New(),
	}
}

type PropertyTypeCreateRequest struct {
	Name string `json:"name" binding:"required,max=50"`
}

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