package handlers

import (
	"net/http"
	"rental-service/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateAmenityRequest — создание одного удобства
type CreateAmenityRequest struct {
	Name string `json:"name" binding:"required"`
}

// UpdateAmenityRequest — обновление удобства
type UpdateAmenityRequest struct {
	Name string `json:"name" binding:"required"`
}

// CreateAmenity — создание нового удобства
func (h *Handler) CreateAmenity(c *gin.Context) {
	var req CreateAmenityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	// Проверяем, не существует ли уже такое удобство
	var existing models.Amenity
	if err := h.DB.Where("name = ?", req.Name).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"message": "amenity already exists", "id": existing.ID})
		return
	}

	amenity := models.Amenity{
		Name: req.Name,
	}

	if err := h.DB.Create(&amenity).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create amenity"})
		return
	}

	c.JSON(http.StatusCreated, amenity)
}

// ListAmenities — получение списка всех удобств
func (h *Handler) ListAmenities(c *gin.Context) {
	var amenities []models.Amenity
	if err := h.DB.Order("name ASC").Find(&amenities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to list amenities"})
		return
	}
	c.JSON(http.StatusOK, amenities)
}

// GetAmenityByID — получение удобства по ID
func (h *Handler) GetAmenityByID(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}

	var amenity models.Amenity
	if err := h.DB.First(&amenity, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"message": "amenity not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to load amenity"})
		return
	}
	c.JSON(http.StatusOK, amenity)
}

// UpdateAmenity — обновление удобства
func (h *Handler) UpdateAmenity(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}

	var req UpdateAmenityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	var amenity models.Amenity
	if err := h.DB.First(&amenity, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"message": "amenity not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to load amenity"})
		return
	}

	// Проверяем, не пытаемся ли переименовать в уже существующее имя
	var existing models.Amenity
	if err := h.DB.Where("name = ? AND id != ?", req.Name, id).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"message": "amenity with this name already exists", "id": existing.ID})
		return
	}

	amenity.Name = req.Name
	if err := h.DB.Save(&amenity).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to update amenity"})
		return
	}

	c.JSON(http.StatusOK, amenity)
}

// DeleteAmenity — удаление удобства
func (h *Handler) DeleteAmenity(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}

	var amenity models.Amenity
	if err := h.DB.First(&amenity, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"message": "amenity not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to load amenity"})
		return
	}

	// Проверяем, не привязано ли удобство к каким-либо объектам недвижимости
	var count int64
	h.DB.Model(&models.PropertyAmenity{}).Where("amenity_id = ?", id).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"message": "cannot delete amenity: it is used by one or more properties",
			"used_by": count,
		})
		return
	}

	if err := h.DB.Delete(&amenity).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to delete amenity"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "amenity deleted successfully"})
}

// BulkCreateAmenities — массовое создание удобств (удобно для инициализации)
type BulkCreateAmenitiesRequest struct {
	Names []string `json:"names" binding:"required,min=1"`
}

func (h *Handler) BulkCreateAmenities(c *gin.Context) {
	var req BulkCreateAmenitiesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	var created []models.Amenity
	var skipped []string

	for _, name := range req.Names {
		if name == "" {
			continue
		}
		var existing models.Amenity
		if err := h.DB.Where("name = ?", name).First(&existing).Error; err == nil {
			skipped = append(skipped, name)
			continue
		}

		amenity := models.Amenity{Name: name}
		if err := h.DB.Create(&amenity).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create amenity: " + name})
			return
		}
		created = append(created, amenity)
	}

	c.JSON(http.StatusCreated, gin.H{
		"created": created,
		"skipped": skipped,
		"total":   len(created),
	})
}
