package handlers

import (
	"net/http"
	"rental-api/internal/config"
	"rental-api/internal/repositories"
	"rental-api/internal/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ImageHandler struct {
	imageService services.PropertyImageService
	cfg          *config.Config
}

func NewImageHandler(cfg *config.Config) *ImageHandler {
	imageRepo := repositories.NewPropertyImageRepository()
	propertyRepo := repositories.NewPropertyRepository()
	imageService := services.NewPropertyImageService(imageRepo, propertyRepo, cfg)
	return &ImageHandler{
		imageService: imageService,
		cfg:          cfg,
	}
}

// ImageResponse matches OpenAPI schema ImageResponse
type ImageResponse struct {
	ID       uint   `json:"id"`
	ImageURL string `json:"image_url"`
	IsMain   bool   `json:"is_main"`
}

func (h *ImageHandler) Upload(c *gin.Context) {
	userID, _ := c.Get("user_id")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Authentication required",
			},
		})
		return
	}

	propertyIDStr := c.Param("id")
	propertyID, err := strconv.ParseUint(propertyIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid property ID",
			},
		})
		return
	}

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil { // 10MB
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Failed to parse form",
			},
		})
		return
	}

	file, fileHeader, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Missing image file",
			},
		})
		return
	}
	defer file.Close()

	isMain := c.Request.FormValue("is_main") == "true"

	image, err := h.imageService.Upload(uint(propertyID), fileHeader, isMain, userID.(uint))
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "forbidden" {
			status = http.StatusForbidden
		} else if err.Error() == "property not found" {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{
			"error": gin.H{
				"code":    "UPLOAD_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, ImageResponse{
		ID:       image.ID,
		ImageURL: image.ImageURL,
		IsMain:   image.IsMain,
	})
}

func (h *ImageHandler) List(c *gin.Context) {
	propertyIDStr := c.Param("id")
	propertyID, err := strconv.ParseUint(propertyIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid property ID",
			},
		})
		return
	}

	images, err := h.imageService.List(uint(propertyID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to retrieve images",
			},
		})
		return
	}

	response := make([]ImageResponse, len(images))
	for i, img := range images {
		response[i] = ImageResponse{
			ID:       img.ID,
			ImageURL: img.ImageURL,
			IsMain:   img.IsMain,
		}
	}
	c.JSON(http.StatusOK, response)
}

func (h *ImageHandler) Delete(c *gin.Context) {
	userID, _ := c.Get("user_id")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Authentication required",
			},
		})
		return
	}

	imageIDStr := c.Param("imageId")
	imageID, err := strconv.ParseUint(imageIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid image ID",
			},
		})
		return
	}

	err = h.imageService.Delete(uint(imageID), userID.(uint))
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "forbidden" {
			status = http.StatusForbidden
		} else if err.Error() == "image not found" {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{
			"error": gin.H{
				"code":    "DELETE_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *ImageHandler) SetMain(c *gin.Context) {
	userID, _ := c.Get("user_id")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Authentication required",
			},
		})
		return
	}

	imageIDStr := c.Param("imageId")
	imageID, err := strconv.ParseUint(imageIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid image ID",
			},
		})
		return
	}

	image, err := h.imageService.SetMain(uint(imageID), userID.(uint))
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "forbidden" {
			status = http.StatusForbidden
		} else if err.Error() == "image not found" {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{
			"error": gin.H{
				"code":    "SET_MAIN_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, ImageResponse{
		ID:       image.ID,
		ImageURL: image.ImageURL,
		IsMain:   image.IsMain,
	})
}
