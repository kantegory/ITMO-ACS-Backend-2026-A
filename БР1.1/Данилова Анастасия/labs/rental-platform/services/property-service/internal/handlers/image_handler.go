package handlers

import (
	"net/http"

	"rental-platform/services/property-service/internal/services"
	sharedmw "rental-platform/shared/middleware"

	"github.com/gin-gonic/gin"
)

type ImageHandler struct {
	Service *services.PropertyService
}

func (h *ImageHandler) ListImages(c *gin.Context) {
	propertyID, err := parseUintParam(c, "property_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid property_id"})
		return
	}

	images, err := h.Service.ListImages(propertyID)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	resp := make([]propertyImageResponse, 0, len(images))
	for _, img := range images {
		resp = append(resp, toPropertyImageResponse(img))
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ImageHandler) AddImage(c *gin.Context) {
	userID, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	propertyID, err := parseUintParam(c, "property_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid property_id"})
		return
	}

	var req struct {
		ImageURL string `json:"image_url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	image, err := h.Service.AddImage(propertyID, userID, req.ImageURL)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, toPropertyImageResponse(*image))
}

func (h *ImageHandler) DeleteImage(c *gin.Context) {
	userID, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	imageID, err := parseUintParam(c, "image_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid image_id"})
		return
	}

	if err := h.Service.DeleteImage(imageID, userID); err != nil {
		writeServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
