package handlers

import (
	"net/http"
	"rental-api/internal/config"
	"rental-api/internal/models"
	"rental-api/internal/repositories"
	"rental-api/internal/services"
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
	rentalRepo := repositories.NewRentalRepository()
	userRepo := repositories.NewUserRepository()
	propertyRepo := repositories.NewPropertyRepository()
	messageService := services.NewMessageService(messageRepo, rentalRepo, userRepo, propertyRepo)
	return &MessageHandler{
		messageService: messageService,
		cfg:            cfg,
		validate:       validator.New(),
	}
}

// SendRequest matches OpenAPI schema for POST /messages
type SendRequest struct {
	ReceiverID  uint   `json:"receiver_id" binding:"required"`
	PropertyID  uint   `json:"property_id" binding:"required"`
	MessageText string `json:"message_text" binding:"required,max=2000"`
}

// MessageResponse matches OpenAPI schema MessageResponse
type MessageResponse struct {
	ID          uint   `json:"id"`
	SenderID    uint   `json:"sender_id"`
	ReceiverID  uint   `json:"receiver_id"`
	PropertyID  uint   `json:"property_id"`
	MessageText string `json:"message_text"`
	SentAt      string `json:"sent_at"`
}

// ConversationResponse matches OpenAPI schema for GET /messages/conversations
type ConversationResponse struct {
	PropertyID    uint   `json:"property_id"`
	PropertyTitle string `json:"property_title"`
	OtherUserID   uint   `json:"other_user_id"`
	OtherUserName string `json:"other_user_name"`
	LastMessage   string `json:"last_message"`
	LastSentAt    string `json:"last_sent_at"`
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

func conversationToResponse(conv *repositories.Conversation) ConversationResponse {
	return ConversationResponse{
		PropertyID:    conv.PropertyID,
		PropertyTitle: conv.PropertyTitle,
		OtherUserID:   conv.OtherUserID,
		OtherUserName: conv.OtherUserName,
		LastMessage:   conv.LastMessage,
		LastSentAt:    conv.LastSentAt,
	}
}

// Helper to get user ID from context
func getUserID(c *gin.Context) (uint, bool) {
	uid, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}
	switch v := uid.(type) {
	case uint:
		return v, true
	case float64:
		return uint(v), true
	default:
		return 0, false
	}
}

// Send a message
func (h *MessageHandler) Send(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Authentication required",
			},
		})
		return
	}

	var req SendRequest
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

	input := services.MessageInput{
		ReceiverID:  req.ReceiverID,
		PropertyID:  req.PropertyID,
		MessageText: req.MessageText,
	}

	message, err := h.messageService.Send(input, userID)
	if err != nil {
		status := http.StatusBadRequest
		switch err.Error() {
		case "receiver not found", "property not found":
			status = http.StatusNotFound
		case "sender is not participating in rental of this property":
			status = http.StatusForbidden
		case "message must be between 1 and 2000 characters":
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{
			"error": gin.H{
				"code":    "SEND_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, messageToResponse(message))
}

// Conversations returns list of conversations for the current user
func (h *MessageHandler) Conversations(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Authentication required",
			},
		})
		return
	}

	conversations, err := h.messageService.Conversations(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to retrieve conversations",
				"details": err.Error(),
			},
		})
		return
	}

	items := make([]ConversationResponse, len(conversations))
	for i, conv := range conversations {
		items[i] = conversationToResponse(&conv)
	}
	c.JSON(http.StatusOK, items)
}

// History returns message history between current user and another user for a property
func (h *MessageHandler) History(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Authentication required",
			},
		})
		return
	}

	propertyIDStr := c.Param("propertyId")
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
	otherUserIDStr := c.Param("userId")
	otherUserID, err := strconv.ParseUint(otherUserIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid user ID",
			},
		})
		return
	}

	messages, err := h.messageService.History(uint(propertyID), userID, uint(otherUserID))
	if err != nil {
		status := http.StatusBadRequest
		switch err.Error() {
		case "user is not participating in rental of this property with the other user":
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{
			"error": gin.H{
				"code":    "HISTORY_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	items := make([]MessageResponse, len(messages))
	for i, msg := range messages {
		items[i] = messageToResponse(&msg)
	}
	c.JSON(http.StatusOK, items)
}
