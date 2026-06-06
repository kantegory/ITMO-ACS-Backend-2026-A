package handlers

import (
	"net/http"

	"rental-platform/services/property-service/internal/services"

	"github.com/gin-gonic/gin"
)

type AmenityHandler struct {
	Service *services.PropertyService
}

func (h *AmenityHandler) ListAmenities(c *gin.Context) {
	amenities, err := h.Service.ListAmenities()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to list amenities"})
		return
	}

	resp := make([]amenityResponse, 0, len(amenities))
	for _, a := range amenities {
		resp = append(resp, toAmenityResponse(a))
	}
	c.JSON(http.StatusOK, resp)
}

func (h *AmenityHandler) CreateAmenity(c *gin.Context) {
	var req struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	amenity, err := h.Service.CreateAmenity(req.Name)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, toAmenityResponse(*amenity))
}

func (h *AmenityHandler) UpdateAmenity(c *gin.Context) {
	id, err := parseUintParam(c, "amenity_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid amenity_id"})
		return
	}

	var req struct {
		Name *string `json:"name"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	amenity, err := h.Service.UpdateAmenity(id, req.Name)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, toAmenityResponse(*amenity))
}

func (h *AmenityHandler) DeleteAmenity(c *gin.Context) {
	id, err := parseUintParam(c, "amenity_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid amenity_id"})
		return
	}

	if err := h.Service.DeleteAmenity(id); err != nil {
		writeServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

type amenityResponse struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}
