package handlers

import (
	"messaging-service/internal/client"
	"messaging-service/internal/config"
	"messaging-service/internal/models"
	"messaging-service/internal/repositories"
	"messaging-service/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type MessageHandler struct {
	messageService services.MessageService
	cfg            *config.Config
	validate       *validator.Validate
}

func NewMessageHandler(cfg *config.Config) *MessageHandler {
	messageRepo := repositories.NewMessageRepository()
	authClient := client.NewAuthClient(cfg)
	bookingClient := client.NewBookingClient(cfg)
	propertyClient := client.NewPropertyClient(cfg)
	messageService := services.NewMessageService(messageRepo, authClient, bookingClient, propertyClient)
	return &MessageHandler{
		messageService: messageService,
		cfg:            cfg,
		validate:       validator.New(),
	}
}

type SendRequest struct {
	ReceiverID  int    `json:"receiver_id" binding:"required"`
	PropertyID  int    `json:"property_id" binding:"required"`
	MessageText string `json:"message_text" binding:"required,max=2000"`
}

type MessageResponse struct {
	ID          uint   `json:"id"`
	SenderID    int    `json:"sender_id"`
	ReceiverID  int    `json:"receiver_id"`
	PropertyID  int    `json:"property_id"`
	MessageText string `json:"message_text"`
	SentAt      string `json:"sent_at"`
}

type ConversationResponse struct {
	PropertyID    int    `json:"property_id"`
	PropertyTitle string `json:"property_title,omitempty"`
	OtherUserID   int    `json:"other_user_id"`
	OtherUserName string `json:"other_user_name"`
	LastMessage   string `json:"last_message"`
	LastSentAt    string `json:"last_sent_at"`
}

type MessageDetailResponse struct {
	ID            uint   `json:"id"`
	SenderID      int    `json:"sender_id"`
	SenderName    string `json:"sender_name"`
	ReceiverID    int    `json:"receiver_id"`
	ReceiverName  string `json:"receiver_name"`
	PropertyID    int    `json:"property_id"`
	MessageText   string `json:"message_text"`
	SentAt        string `json:"sent_at"`
}

func getUserID(c *gin.Context) (int, bool) {
	uid, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}
	switch v := uid.(type) {
	case uint:
		return int(v), true
	case int:
		return v, true
	case float64:
		return int(v), true
	default:
		return 0, false
	}
}

func messageToResponse(msg *models.Message) MessageResponse {
	return MessageResponse{
		ID:          msg.ID,
		SenderID:    msg.SenderID,
		ReceiverID:  msg.ReceiverID,
		PropertyID:  msg.PropertyID,
		MessageText: msg.MessageText,
		SentAt:      msg.SentAt.Format("2006-01-02T15:04:05Z"),
	}
}

func (h *MessageHandler) Send(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Authentication required"}})
		return
	}

	var req SendRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": "Invalid request format", "details": err.Error()}})
		return
	}

	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": "Validation failed", "details": err.Error()}})
		return
	}

	input := services.MessageInput{
		ReceiverID:  req.ReceiverID,
		PropertyID:  req.PropertyID,
		MessageText: req.MessageText,
	}

	message, err := h.messageService.Send(input, userID)
	if err != nil {
		status := http.StatusBadRequest
		switch err.Error() {
		case "sender is not participating in rental of this property":
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": gin.H{"code": "SEND_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusCreated, messageToResponse(message))
}

func (h *MessageHandler) Conversations(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Authentication required"}})
		return
	}

	conversations, err := h.messageService.Conversations(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to retrieve conversations", "details": err.Error()}})
		return
	}

	if conversations == nil {
		conversations = []services.ConversationResult{}
	}
	c.JSON(http.StatusOK, conversations)
}

func (h *MessageHandler) History(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Authentication required"}})
		return
	}

	propertyIDStr := c.Param("propertyId")
	propertyID, err := strconv.Atoi(propertyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": "Invalid property ID"}})
		return
	}

	otherUserIDStr := c.Param("userId")
	otherUserID, err := strconv.Atoi(otherUserIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": "Invalid user ID"}})
		return
	}

	messages, err := h.messageService.History(propertyID, userID, otherUserID)
	if err != nil {
		status := http.StatusBadRequest
		switch err.Error() {
		case "user is not participating in rental of this property with the other user":
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": gin.H{"code": "HISTORY_ERROR", "message": err.Error()}})
		return
	}

	if messages == nil {
		messages = []services.MessageResult{}
	}
	c.JSON(http.StatusOK, messages)
}