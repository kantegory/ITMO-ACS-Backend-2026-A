package handlers

import (
	"net/http"
	"property-service/internal/config"
	"property-service/internal/repositories"
	"property-service/internal/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

type InternalHandler struct {
	propertyService services.PropertyService
	propertyRepo   repositories.PropertyRepository
	cfg            *config.Config
}

func NewInternalHandler(cfg *config.Config, propertyService services.PropertyService) *InternalHandler {
	propertyRepo := repositories.NewPropertyRepository()
	return &InternalHandler{
		propertyService: propertyService,
		propertyRepo:    propertyRepo,
		cfg:             cfg,
	}
}

func (h *InternalHandler) GetPropertyByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "INVALID_REQUEST", "message": "Invalid property ID"},
		})
		return
	}

	property, err := h.propertyService.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{"code": "NOT_FOUND", "message": "Property not found"},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":           property.ID,
		"owner_id":     property.OwnerID,
		"type_id":      property.TypeID,
		"title":        property.Title,
		"description":  property.Description,
		"price_per_day": property.PricePerDay,
		"city":         property.City,
		"address":      property.Address,
		"latitude":     property.Latitude,
		"longitude":    property.Longitude,
		"status":       property.Status,
		"created_at":   property.CreatedAt,
	})
}

func (h *InternalHandler) GetPropertiesBatch(c *gin.Context) {
	var req struct {
		IDs []uint `json:"ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "INVALID_REQUEST", "message": "IDs array is required"},
		})
		return
	}

	if len(req.IDs) == 0 || len(req.IDs) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "INVALID_REQUEST", "message": "IDs array must contain 1-100 elements"},
		})
		return
	}

	var properties []gin.H
	var notFound []uint

	for _, id := range req.IDs {
		property, err := h.propertyRepo.FindByID(id)
		if err != nil {
			notFound = append(notFound, id)
			continue
		}
		properties = append(properties, gin.H{
			"id":           property.ID,
			"owner_id":     property.OwnerID,
			"type_id":      property.TypeID,
			"title":        property.Title,
			"description":  property.Description,
			"price_per_day": property.PricePerDay,
			"city":         property.City,
			"address":      property.Address,
			"latitude":     property.Latitude,
			"longitude":    property.Longitude,
			"status":       property.Status,
			"created_at":   property.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"properties": properties,
		"not_found":  notFound,
	})
}

func (h *InternalHandler) CheckOwner(c *gin.Context) {
	idStr := c.Param("id")
	propertyID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "INVALID_REQUEST", "message": "Invalid property ID"},
		})
		return
	}

	userIDStr := c.Query("user_id")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "INVALID_REQUEST", "message": "user_id query parameter is required"},
		})
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "INVALID_REQUEST", "message": "Invalid user_id"},
		})
		return
	}

	property, err := h.propertyRepo.FindByID(uint(propertyID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{"code": "NOT_FOUND", "message": "Property not found"},
		})
		return
	}

	isOwner := property.OwnerID == uint(userID)
	c.JSON(http.StatusOK, gin.H{
		"property_id": property.ID,
		"owner_id":    property.OwnerID,
		"user_id":     userID,
		"is_owner":    isOwner,
	})
}