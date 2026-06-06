package handlers

import (
	"net/http"
	"strconv"

	"rental-service/internal/middleware"
	"rental-service/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Handler struct {
	DB *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{DB: db}
}

type CreatePropertyRequest struct {
	Title   string `json:"title" binding:"required"`
	Type    string `json:"type" binding:"required"`
	City    string `json:"city" binding:"required"`
	Address string `json:"address"`

	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`

	Description     string `json:"description"`
	PricePerMonth   int    `json:"price_per_month" binding:"required,min=0"`
	Deposit         int    `json:"deposit" binding:"min=0"`
	Commission      int    `json:"commission" binding:"min=0"`
	Area            int    `json:"area" binding:"min=0"`
	Prepayment      string `json:"prepayment"`
	MinRentalPeriod string `json:"min_rental_period"`

	AmenityIDs []uint   `json:"amenity_ids"`
	ImageURLs  []string `json:"image_urls"`
}

type UpdatePropertyRequest struct {
	Title   *string `json:"title"`
	Type    *string `json:"type"`
	City    *string `json:"city"`
	Address *string `json:"address"`

	Latitude  *float64 `json:"latitude"`
	Longitude *float64 `json:"longitude"`

	Description     *string `json:"description"`
	PricePerMonth   *int    `json:"price_per_month"`
	Deposit         *int    `json:"deposit"`
	Commission      *int    `json:"commission"`
	Area            *int    `json:"area"`
	Prepayment      *string `json:"prepayment"`
	MinRentalPeriod *string `json:"min_rental_period"`

	IsVacant   *bool `json:"is_vacant"`
	IsVerified *bool `json:"is_verified"`

	AmenityIDs *[]uint   `json:"amenity_ids"`
	ImageURLs  *[]string `json:"image_urls"`
}

func (h *Handler) CreateProperty(c *gin.Context) {
	var req CreatePropertyRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	userID, ok := c.Get(middleware.ContextUserIDKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	pType := models.PropertyType(req.Type)
	if !pType.IsValid() {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid property type"})
		return
	}

	var amenities []models.Amenity
	if len(req.AmenityIDs) > 0 {
		h.DB.Where("id IN ?", req.AmenityIDs).Find(&amenities)
	}

	property := models.Property{
		OwnerID:         userID.(uint),
		Title:     req.Title,
		Type:      pType,
		City:      req.City,
		Address:   req.Address,
		Latitude:  req.Latitude,
		Longitude: req.Longitude,

		Description:     req.Description,
		PricePerMonth:   req.PricePerMonth,
		Deposit:         req.Deposit,
		Commission:      req.Commission,
		Area:            req.Area,
		Prepayment:      req.Prepayment,
		MinRentalPeriod: req.MinRentalPeriod,

		IsVerified: false,
		IsVacant:   true,
		Amenities: amenities,
	}

	if err := h.DB.Create(&property).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create property"})
		return
	}

	if len(req.ImageURLs) > 0 {
		var images []models.PropertyImage
		for _, url := range req.ImageURLs {
			if url == "" {
				continue
			}
			images = append(images, models.PropertyImage{
				PropertyID: property.ID,
				ImageURL:   url,
			})
		}
		if len(images) > 0 {
			_ = h.DB.Create(&images).Error
		}
	}

	h.DB.Preload("Amenities").Preload("Images").First(&property, property.ID)

	c.JSON(http.StatusCreated, property)
}

func (h *Handler) ListProperties(c *gin.Context) {
	q := h.DB.Model(&models.Property{}).Preload("Amenities").Preload("Images")

	if t := c.Query("type"); t != "" {
		pt := models.PropertyType(t)
		if !pt.IsValid() {
			c.JSON(http.StatusBadRequest, gin.H{"message": "invalid property type"})
			return
		}
		q = q.Where("type = ?", pt)
	}
	if city := c.Query("city"); city != "" {
		q = q.Where("city ILIKE ?", "%"+city+"%")
	}
	if location := c.Query("location"); location != "" {
		q = q.Where("(city ILIKE ? OR address ILIKE ?)", "%"+location+"%", "%"+location+"%")
	}
	if minP := c.Query("min_price"); minP != "" {
		if v, err := strconv.Atoi(minP); err == nil {
			q = q.Where("price_per_month >= ?", v)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"message": "invalid min_price"})
			return
		}
	}
	if maxP := c.Query("max_price"); maxP != "" {
		if v, err := strconv.Atoi(maxP); err == nil {
			q = q.Where("price_per_month <= ?", v)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"message": "invalid max_price"})
			return
		}
	}

	// by default show only vacant properties (can be overridden)
	if c.Query("include_not_vacant") != "true" {
		q = q.Where("is_vacant = ?", true)
	}

	var props []models.Property
	if err := q.Order("id desc").Find(&props).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to list properties"})
		return
	}
	c.JSON(http.StatusOK, props)
}

func (h *Handler) GetPropertyByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}

	var prop models.Property
	if err := h.DB.Preload("Amenities").Preload("Images").First(&prop, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"message": "property not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to load property"})
		return
	}
	c.JSON(http.StatusOK, prop)
}

func (h *Handler) UpdateProperty(c *gin.Context) {
	userID, ok := c.Get(middleware.ContextUserIDKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}

	var prop models.Property
	if err := h.DB.Preload("Amenities").Preload("Images").First(&prop, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"message": "property not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to load property"})
		return
	}
	if prop.OwnerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"message": "forbidden"})
		return
	}

	var req UpdatePropertyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	if req.Type != nil {
		pt := models.PropertyType(*req.Type)
		if !pt.IsValid() {
			c.JSON(http.StatusBadRequest, gin.H{"message": "invalid property type"})
			return
		}
		prop.Type = pt
	}
	if req.Title != nil {
		prop.Title = *req.Title
	}
	if req.City != nil {
		prop.City = *req.City
	}
	if req.Address != nil {
		prop.Address = *req.Address
	}
	if req.Latitude != nil {
		prop.Latitude = *req.Latitude
	}
	if req.Longitude != nil {
		prop.Longitude = *req.Longitude
	}
	if req.Description != nil {
		prop.Description = *req.Description
	}
	if req.PricePerMonth != nil {
		if *req.PricePerMonth < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"message": "price_per_month must be >= 0"})
			return
		}
		prop.PricePerMonth = *req.PricePerMonth
	}
	if req.Deposit != nil {
		prop.Deposit = *req.Deposit
	}
	if req.Commission != nil {
		prop.Commission = *req.Commission
	}
	if req.Area != nil {
		prop.Area = *req.Area
	}
	if req.Prepayment != nil {
		prop.Prepayment = *req.Prepayment
	}
	if req.MinRentalPeriod != nil {
		prop.MinRentalPeriod = *req.MinRentalPeriod
	}
	if req.IsVacant != nil {
		prop.IsVacant = *req.IsVacant
	}
	// for now verification is owner-controlled (can be moved to moderator/admin logic later)
	if req.IsVerified != nil {
		prop.IsVerified = *req.IsVerified
	}

	if req.AmenityIDs != nil {
		var amenities []models.Amenity
		if len(*req.AmenityIDs) > 0 {
			h.DB.Where("id IN ?", *req.AmenityIDs).Find(&amenities)
		}
		if err := h.DB.Model(&prop).Association("Amenities").Replace(&amenities); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to update amenities"})
			return
		}
	}

	if req.ImageURLs != nil {
		// replace images list
		if err := h.DB.Where("property_id = ?", prop.ID).Delete(&models.PropertyImage{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to update images"})
			return
		}
		var images []models.PropertyImage
		for _, url := range *req.ImageURLs {
			if url == "" {
				continue
			}
			images = append(images, models.PropertyImage{PropertyID: prop.ID, ImageURL: url})
		}
		if len(images) > 0 {
			_ = h.DB.Create(&images).Error
		}
	}

	if err := h.DB.Save(&prop).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to update property"})
		return
	}
	h.DB.Preload("Amenities").Preload("Images").First(&prop, prop.ID)
	c.JSON(http.StatusOK, prop)
}

func (h *Handler) DeleteProperty(c *gin.Context) {
	userID, ok := c.Get(middleware.ContextUserIDKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}

	var prop models.Property
	if err := h.DB.First(&prop, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"message": "property not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to load property"})
		return
	}
	if prop.OwnerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"message": "forbidden"})
		return
	}

	// cleanup dependent tables
	_ = h.DB.Where("property_id = ?", prop.ID).Delete(&models.PropertyImage{}).Error
	_ = h.DB.Where("property_id = ?", prop.ID).Delete(&models.Chat{}).Error
	_ = h.DB.Where("property_id = ?", prop.ID).Delete(&models.Rental{}).Error

	if err := h.DB.Delete(&prop).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to delete property"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *Handler) GetMe(c *gin.Context) {
	userID, ok := c.Get(middleware.ContextUserIDKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	var user models.User
	if err := h.DB.First(&user, userID.(uint)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to load user"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func (h *Handler) ListMyProperties(c *gin.Context) {
	userID, ok := c.Get(middleware.ContextUserIDKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	var props []models.Property
	if err := h.DB.Where("owner_id = ?", userID.(uint)).Preload("Amenities").Preload("Images").Order("id desc").Find(&props).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to list properties"})
		return
	}
	c.JSON(http.StatusOK, props)
}

func (h *Handler) ListMyRentals(c *gin.Context) {
	userID, ok := c.Get(middleware.ContextUserIDKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	var rentals []models.Rental
	if err := h.DB.Where("tenant_id = ?", userID.(uint)).Preload("Property").Order("id desc").Find(&rentals).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to list rentals"})
		return
	}
	c.JSON(http.StatusOK, rentals)
}

type SendMessageRequest struct {
	Text string `json:"text" binding:"required"`
}

func (h *Handler) StartChatByProperty(c *gin.Context) {
	userID, ok := c.Get(middleware.ContextUserIDKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	propID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid property id"})
		return
	}

	var prop models.Property
	if err := h.DB.First(&prop, uint(propID)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"message": "property not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to load property"})
		return
	}
	if prop.OwnerID == userID.(uint) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "cannot start chat with yourself"})
		return
	}

	// idempotent chat: one chat per property + tenant
	var chat models.Chat
	err = h.DB.Where("property_id = ? AND tenant_id = ? AND landlord_id = ?", prop.ID, userID.(uint), prop.OwnerID).First(&chat).Error
	if err == nil {
		h.DB.Preload("Property").First(&chat, chat.ID)
		c.JSON(http.StatusOK, chat)
		return
	}
	if err != nil && err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to check existing chat"})
		return
	}

	chat = models.Chat{
		PropertyID: prop.ID,
		TenantID:   userID.(uint),
		LandlordID: prop.OwnerID,
	}
	if err := h.DB.Create(&chat).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create chat"})
		return
	}
	h.DB.Preload("Property").First(&chat, chat.ID)
	c.JSON(http.StatusCreated, chat)
}

func (h *Handler) ListMyChats(c *gin.Context) {
	userID, ok := c.Get(middleware.ContextUserIDKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	var chats []models.Chat
	if err := h.DB.
		Where("tenant_id = ? OR landlord_id = ?", userID.(uint), userID.(uint)).
		Preload("Property").
		Order("id desc").
		Find(&chats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to list chats"})
		return
	}
	c.JSON(http.StatusOK, chats)
}

func (h *Handler) ListMessages(c *gin.Context) {
	userID, ok := c.Get(middleware.ContextUserIDKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	chatID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid chat id"})
		return
	}

	var chat models.Chat
	if err := h.DB.First(&chat, uint(chatID)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"message": "chat not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to load chat"})
		return
	}
	if chat.TenantID != userID.(uint) && chat.LandlordID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"message": "forbidden"})
		return
	}

	limit := 50
	offset := 0
	if v := c.Query("limit"); v != "" {
		parsed, err := strconv.Atoi(v)
		if err != nil || parsed <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"message": "invalid limit"})
			return
		}
		if parsed > 200 {
			parsed = 200
		}
		limit = parsed
	}
	if v := c.Query("offset"); v != "" {
		parsed, err := strconv.Atoi(v)
		if err != nil || parsed < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"message": "invalid offset"})
			return
		}
		offset = parsed
	}

	var total int64
	if err := h.DB.Model(&models.Message{}).Where("chat_id = ?", chat.ID).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to count messages"})
		return
	}

	var msgs []models.Message
	if err := h.DB.Where("chat_id = ?", chat.ID).Order("id asc").Limit(limit).Offset(offset).Find(&msgs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to list messages"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"items":  msgs,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

func (h *Handler) SendMessage(c *gin.Context) {
	userID, ok := c.Get(middleware.ContextUserIDKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	chatID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid chat id"})
		return
	}

	var req SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	var chat models.Chat
	if err := h.DB.First(&chat, uint(chatID)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"message": "chat not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to load chat"})
		return
	}
	if chat.TenantID != userID.(uint) && chat.LandlordID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"message": "forbidden"})
		return
	}

	msg := models.Message{
		ChatID:   chat.ID,
		SenderID: userID.(uint),
		Text:     req.Text,
	}
	if err := h.DB.Create(&msg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to send message"})
		return
	}
	c.JSON(http.StatusCreated, msg)
}
