package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"rental-platform/services/property-service/internal/models"
	"rental-platform/services/property-service/internal/repository"
	"rental-platform/services/property-service/internal/services"
	sharedmw "rental-platform/shared/middleware"

	"github.com/gin-gonic/gin"
)

type PropertyHandler struct {
	Service *services.PropertyService
}

func (h *PropertyHandler) ListProperties(c *gin.Context) {
	filter, err := parsePropertyListFilter(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	properties, err := h.Service.ListProperties(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to list properties"})
		return
	}

	resp := make([]propertyShortResponse, 0, len(properties))
	for _, p := range properties {
		resp = append(resp, toPropertyShort(p))
	}
	c.JSON(http.StatusOK, resp)
}

func (h *PropertyHandler) CreateProperty(c *gin.Context) {
	userID, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	var req struct {
		Title         string   `json:"title" binding:"required"`
		Description   string   `json:"description"`
		PropertyType  string   `json:"property_type" binding:"required"`
		City          string   `json:"city" binding:"required"`
		Address       string   `json:"address" binding:"required"`
		PricePerMonth int      `json:"price_per_month" binding:"required"`
		AmenityIDs    []uint   `json:"amenity_ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	property, err := h.Service.CreateProperty(c.Request.Context(), services.CreatePropertyInput{
		OwnerID:       userID,
		Title:         req.Title,
		Description:   req.Description,
		PropertyType:  models.PropertyType(req.PropertyType),
		City:          req.City,
		Address:       req.Address,
		PricePerMonth: req.PricePerMonth,
		AmenityIDs:    req.AmenityIDs,
	})
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, toPropertyFull(*property))
}

func (h *PropertyHandler) GetProperty(c *gin.Context) {
	id, err := parseUintParam(c, "property_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid property_id"})
		return
	}

	property, err := h.Service.GetProperty(id)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, toPropertyFull(*property))
}

func (h *PropertyHandler) UpdateProperty(c *gin.Context) {
	userID, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	id, err := parseUintParam(c, "property_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid property_id"})
		return
	}

	var req struct {
		Title         *string `json:"title"`
		Description   *string `json:"description"`
		City          *string `json:"city"`
		Address       *string `json:"address"`
		PricePerMonth *int    `json:"price_per_month"`
		IsAvailable   *bool   `json:"is_available"`
		AmenityIDs    *[]uint `json:"amenity_ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	property, err := h.Service.UpdateProperty(c.Request.Context(), id, userID, services.UpdatePropertyInput{
		Title:         req.Title,
		Description:   req.Description,
		City:          req.City,
		Address:       req.Address,
		PricePerMonth: req.PricePerMonth,
		IsAvailable:   req.IsAvailable,
		AmenityIDs:    req.AmenityIDs,
	})
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, toPropertyFull(*property))
}

func (h *PropertyHandler) DeleteProperty(c *gin.Context) {
	userID, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	id, err := parseUintParam(c, "property_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid property_id"})
		return
	}

	if err := h.Service.DeleteProperty(c.Request.Context(), id, userID); err != nil {
		writeServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *PropertyHandler) ListMyProperties(c *gin.Context) {
	userID, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	properties, err := h.Service.ListMyProperties(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to list properties"})
		return
	}

	resp := make([]propertyShortResponse, 0, len(properties))
	for _, p := range properties {
		resp = append(resp, toPropertyShort(p))
	}
	c.JSON(http.StatusOK, resp)
}

func (h *PropertyHandler) GetInternalProperty(c *gin.Context) {
	id, err := parseUintParam(c, "property_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid property_id"})
		return
	}

	property, err := h.Service.GetPropertyInternal(id)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, propertyInternalResponse{
		ID:          property.ID,
		OwnerID:     property.OwnerID,
		IsAvailable: property.IsAvailable,
		IsVerified:  property.IsVerified,
	})
}

func parsePropertyListFilter(c *gin.Context) (repository.PropertyListFilter, error) {
	filter := repository.PropertyListFilter{
		City: c.Query("city"),
	}

	if v := c.Query("property_type"); v != "" {
		pt := models.PropertyType(v)
		if !pt.IsValid() {
			return filter, errors.New("invalid property_type")
		}
		filter.PropertyType = &pt
	}
	if v := c.Query("min_price"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 0 {
			return filter, errors.New("invalid min_price")
		}
		filter.MinPrice = &n
	}
	if v := c.Query("max_price"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 0 {
			return filter, errors.New("invalid max_price")
		}
		filter.MaxPrice = &n
	}
	if v := c.Query("is_verified"); v != "" {
		b, err := strconv.ParseBool(v)
		if err != nil {
			return filter, errors.New("invalid is_verified")
		}
		filter.IsVerified = &b
	}
	if v := c.Query("is_available"); v != "" {
		b, err := strconv.ParseBool(v)
		if err != nil {
			return filter, errors.New("invalid is_available")
		}
		filter.IsAvailable = &b
	}

	amenityIDs, err := parseUintQueryArray(c, "amenity_ids")
	if err != nil {
		return filter, errors.New("invalid amenity_ids")
	}
	filter.AmenityIDs = amenityIDs

	limit := 20
	if v := c.Query("limit"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 || n > 100 {
			return filter, errors.New("invalid limit")
		}
		limit = n
	}
	filter.Limit = limit

	offset := 0
	if v := c.Query("offset"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 0 {
			return filter, errors.New("invalid offset")
		}
		offset = n
	}
	filter.Offset = offset

	return filter, nil
}

type propertyShortResponse struct {
	ID            uint   `json:"id"`
	Title         string `json:"title"`
	City          string `json:"city"`
	PricePerMonth int    `json:"price_per_month"`
	IsAvailable   bool   `json:"is_available"`
}

type propertyFullResponse struct {
	ID            uint                  `json:"id"`
	OwnerID       uint                  `json:"owner_id"`
	Title         string                `json:"title"`
	Description   string                `json:"description"`
	PropertyType  models.PropertyType   `json:"property_type"`
	City          string                `json:"city"`
	Address       string                `json:"address"`
	PricePerMonth int                   `json:"price_per_month"`
	IsVerified    bool                  `json:"is_verified"`
	IsAvailable   bool                  `json:"is_available"`
	Amenities     []amenityResponse     `json:"amenities"`
	Images        []propertyImageResponse `json:"images"`
}

type propertyInternalResponse struct {
	ID          uint `json:"id"`
	OwnerID     uint `json:"owner_id"`
	IsAvailable bool `json:"is_available"`
	IsVerified  bool `json:"is_verified"`
}

func toPropertyShort(p models.Property) propertyShortResponse {
	return propertyShortResponse{
		ID:            p.ID,
		Title:         p.Title,
		City:          p.City,
		PricePerMonth: p.PricePerMonth,
		IsAvailable:   p.IsAvailable,
	}
}

func toPropertyFull(p models.Property) propertyFullResponse {
	amenities := make([]amenityResponse, 0, len(p.Amenities))
	for _, a := range p.Amenities {
		amenities = append(amenities, toAmenityResponse(a))
	}
	images := make([]propertyImageResponse, 0, len(p.Images))
	for _, img := range p.Images {
		images = append(images, toPropertyImageResponse(img))
	}
	return propertyFullResponse{
		ID:            p.ID,
		OwnerID:       p.OwnerID,
		Title:         p.Title,
		Description:   p.Description,
		PropertyType:  p.PropertyType,
		City:          p.City,
		Address:       p.Address,
		PricePerMonth: p.PricePerMonth,
		IsVerified:    p.IsVerified,
		IsAvailable:   p.IsAvailable,
		Amenities:     amenities,
		Images:        images,
	}
}
