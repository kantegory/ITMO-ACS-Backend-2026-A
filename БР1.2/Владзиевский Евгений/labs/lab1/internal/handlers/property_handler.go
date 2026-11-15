package handlers

import (
	"net/http"
	"rental-api/internal/config"
	"rental-api/internal/models"
	"rental-api/internal/repositories"
	"rental-api/internal/services"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

func amenitiesToResponse(amenities []models.Amenity) []AmenityResponse {
	result := make([]AmenityResponse, 0, len(amenities))
	for _, amenity := range amenities {
		result = append(result, AmenityResponse{
			ID:          amenity.ID,
			Name:        amenity.Name,
			Icon:        amenity.Icon,
			Description: amenity.Description,
		})
	}
	return result
}

type PropertyHandler struct {
	propertyService services.PropertyService
	cfg             *config.Config
	validate        *validator.Validate
}

func NewPropertyHandler(cfg *config.Config) *PropertyHandler {
	propertyRepo := repositories.NewPropertyRepository()
	userRepo := repositories.NewUserRepository()
	propertyService := services.NewPropertyService(propertyRepo, userRepo)
	return &PropertyHandler{
		propertyService: propertyService,
		cfg:             cfg,
		validate:        validator.New(),
	}
}

// AmenityResponse matches OpenAPI schema Amenity
type AmenityResponse struct {
	ID          uint    `json:"id"`
	Name        string  `json:"name"`
	Icon        *string `json:"icon,omitempty"`
	Description *string `json:"description,omitempty"`
}

// PropertyListItemResponse matches OpenAPI schema PropertyListItem
type PropertyListItemResponse struct {
	ID           uint              `json:"id"`
	Title        string            `json:"title"`
	City         string            `json:"city"`
	PricePerDay  float64           `json:"price_per_day"`
	MainImageURL *string           `json:"main_image_url,omitempty"`
	TypeName     string            `json:"type_name"`
	Amenities    []AmenityResponse `json:"amenities,omitempty"`
}

// PropertyDetailResponse matches OpenAPI schema PropertyDetail
type PropertyDetailResponse struct {
	PropertyListItemResponse
	Description *string                 `json:"description,omitempty"`
	Address     string                  `json:"address"`
	Latitude    *float64                `json:"latitude,omitempty"`
	Longitude   *float64                `json:"longitude,omitempty"`
	Owner       interface{}             `json:"owner"`
	Images      []PropertyImageResponse `json:"images"`
	Status      string                  `json:"status"`
	CreatedAt   string                  `json:"created_at"`
}

type PropertyImageResponse struct {
	ID       uint   `json:"id"`
	ImageURL string `json:"image_url"`
	IsMain   bool   `json:"is_main"`
}

// CreateRequest matches OpenAPI schema PropertyInput
type CreateRequest struct {
	TypeID      uint     `json:"type_id" binding:"required"`
	Title       string   `json:"title" binding:"required,max=255"`
	Description *string  `json:"description,omitempty"`
	PricePerDay float64  `json:"price_per_day" binding:"required,min=0.01"`
	City        string   `json:"city" binding:"required,max=100"`
	Address     string   `json:"address" binding:"required"`
	Latitude    *float64 `json:"latitude,omitempty"`
	Longitude   *float64 `json:"longitude,omitempty"`
	AmenityIDs  []uint   `json:"amenity_ids,omitempty"`
}

// UpdateStatusRequest matches request body for PATCH /properties/{id}/status
type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=active archived"`
}

func (h *PropertyHandler) List(c *gin.Context) {
	var filters services.PropertyFilters
	if err := c.ShouldBindQuery(&filters); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid query parameters",
				"details": err.Error(),
			},
		})
		return
	}

	// Set defaults
	if filters.Limit == 0 {
		filters.Limit = 20
	}
	if filters.Limit > 100 {
		filters.Limit = 100
	}

	properties, total, err := h.propertyService.List(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to retrieve properties",
				"details": err.Error(),
			},
		})
		return
	}

	// Map to response
	items := make([]PropertyListItemResponse, len(properties))
	for i, p := range properties {
		var mainImageURL *string
		if len(p.Images) > 0 {
			mainImageURL = &p.Images[0].ImageURL
		}
		typeName := ""
		if p.Type.ID != 0 {
			typeName = p.Type.Name
		}
		items[i] = PropertyListItemResponse{
			ID:           p.ID,
			Title:        p.Title,
			City:         p.City,
			PricePerDay:  p.PricePerDay,
			MainImageURL: mainImageURL,
			TypeName:     typeName,
			Amenities:    amenitiesToResponse(p.Amenities),
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"total": total,
		"items": items,
	})
}

func (h *PropertyHandler) Get(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid property ID",
			},
		})
		return
	}

	property, err := h.propertyService.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Property not found",
			},
		})
		return
	}

	// Map to PropertyDetailResponse
	var mainImageURL *string
	if len(property.Images) > 0 {
		mainImageURL = &property.Images[0].ImageURL
	}
	typeName := ""
	if property.Type.ID != 0 {
		typeName = property.Type.Name
	}

	// Build images list
	images := make([]PropertyImageResponse, len(property.Images))
	for i, img := range property.Images {
		images[i] = PropertyImageResponse{
			ID:       img.ID,
			ImageURL: img.ImageURL,
			IsMain:   img.IsMain,
		}
	}

	// Owner response (simplified)
	owner := gin.H{
		"id":         property.Owner.ID,
		"email":      property.Owner.Email,
		"full_name":  property.Owner.FullName,
		"phone":      property.Owner.Phone,
		"role":       property.Owner.Role,
		"created_at": property.Owner.CreatedAt.Format(time.RFC3339),
	}

	response := PropertyDetailResponse{
		PropertyListItemResponse: PropertyListItemResponse{
			ID:           property.ID,
			Title:        property.Title,
			City:         property.City,
			PricePerDay:  property.PricePerDay,
			MainImageURL: mainImageURL,
			TypeName:     typeName,
		},
		Description: property.Description,
		Address:     property.Address,
		Latitude:    property.Latitude,
		Longitude:   property.Longitude,
		Owner:       owner,
		Images:      images,
		Status:      property.Status,
		CreatedAt:   property.CreatedAt.Format(time.RFC3339),
	}
	c.JSON(http.StatusOK, response)
}

func (h *PropertyHandler) Create(c *gin.Context) {
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

	var req CreateRequest
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

	input := services.PropertyInput{
		TypeID:      req.TypeID,
		Title:       req.Title,
		Description: req.Description,
		PricePerDay: req.PricePerDay,
		City:        req.City,
		Address:     req.Address,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
	}

	property, err := h.propertyService.Create(input, userID.(uint))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "CREATE_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	// Return PropertyDetailResponse (similar to Get)
	c.JSON(http.StatusCreated, gin.H{
		"id":            property.ID,
		"title":         property.Title,
		"city":          property.City,
		"price_per_day": property.PricePerDay,
		"description":   property.Description,
		"address":       property.Address,
		"latitude":      property.Latitude,
		"longitude":     property.Longitude,
		"status":        property.Status,
		"created_at":    property.CreatedAt.Format(time.RFC3339),
	})
}

func (h *PropertyHandler) Update(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Authentication required",
			},
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid property ID",
			},
		})
		return
	}

	var req CreateRequest // reuse same struct (all fields optional except validation)
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

	input := services.PropertyInput{
		TypeID:      req.TypeID,
		Title:       req.Title,
		Description: req.Description,
		PricePerDay: req.PricePerDay,
		City:        req.City,
		Address:     req.Address,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
	}

	property, err := h.propertyService.Update(uint(id), input, userID.(uint), userRole.(string))
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "forbidden" {
			status = http.StatusForbidden
		} else if err.Error() == "property not found" {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{
			"error": gin.H{
				"code":    "UPDATE_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":            property.ID,
		"title":         property.Title,
		"city":          property.City,
		"price_per_day": property.PricePerDay,
		"description":   property.Description,
		"address":       property.Address,
		"latitude":      property.Latitude,
		"longitude":     property.Longitude,
		"status":        property.Status,
		"created_at":    property.CreatedAt.Format(time.RFC3339),
	})
}

func (h *PropertyHandler) Delete(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Authentication required",
			},
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid property ID",
			},
		})
		return
	}

	err = h.propertyService.Delete(uint(id), userID.(uint), userRole.(string))
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "forbidden" {
			status = http.StatusForbidden
		} else if err.Error() == "property not found" {
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

func (h *PropertyHandler) UpdateStatus(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Authentication required",
			},
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid property ID",
			},
		})
		return
	}

	var req UpdateStatusRequest
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

	property, err := h.propertyService.UpdateStatus(uint(id), req.Status, userID.(uint), userRole.(string))
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "forbidden" {
			status = http.StatusForbidden
		} else if err.Error() == "property not found" {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{
			"error": gin.H{
				"code":    "STATUS_UPDATE_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":     property.ID,
		"status": property.Status,
	})
}
