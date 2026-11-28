package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"rental-platform/services/chat-service/internal/services"
	sharedmw "rental-platform/shared/middleware"

	"github.com/gin-gonic/gin"
)

type ChatHandler struct {
	Service *services.ChatService
}

func (h *ChatHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "chat-service"})
}

func (h *ChatHandler) ListChats(c *gin.Context) {
	userID, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	var propertyID *uint
	if v := c.Query("property_id"); v != "" {
		id, err := parseID(v)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "invalid property_id"})
			return
		}
		propertyID = &id
	}

	limit, offset := pagination(c, 20, 100)
	chats, err := h.Service.ListChats(userID, propertyID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to list chats"})
		return
	}
	c.JSON(http.StatusOK, chats)
}

func (h *ChatHandler) CreateChat(c *gin.Context) {
	userID, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	var req struct {
		PropertyID uint `json:"property_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	chat, exists, err := h.Service.CreateChat(c.Request.Context(), userID, req.PropertyID)
	if err != nil {
		switch {
		case services.IsNotFound(err):
			c.JSON(http.StatusNotFound, gin.H{"message": "property not found"})
		case err == services.ErrBadRequest:
			c.JSON(http.StatusBadRequest, gin.H{"message": "cannot create chat with yourself"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create chat"})
		}
		return
	}

	status := http.StatusCreated
	if exists {
		status = http.StatusOK
	}
	c.JSON(status, chat)
}

func (h *ChatHandler) GetChat(c *gin.Context) {
	userID, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	chatID, err := parseID(c.Param("chat_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid chat id"})
		return
	}

	chat, err := h.Service.GetChat(userID, chatID)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, chat)
}

func (h *ChatHandler) DeleteChat(c *gin.Context) {
	userID, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	chatID, err := parseID(c.Param("chat_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid chat id"})
		return
	}

	if err := h.Service.DeleteChat(userID, chatID); err != nil {
		writeServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ChatHandler) ListMessages(c *gin.Context) {
	userID, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	chatID, err := parseID(c.Param("chat_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid chat id"})
		return
	}

	limit, offset := pagination(c, 50, 200)
	messages, err := h.Service.ListMessages(userID, chatID, limit, offset)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, messages)
}

func (h *ChatHandler) SendMessage(c *gin.Context) {
	userID, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	chatID, err := parseID(c.Param("chat_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid chat id"})
		return
	}

	var req struct {
		Text string `json:"text" binding:"required,min=1,max=5000"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	msg, err := h.Service.SendMessage(c.Request.Context(), userID, chatID, req.Text)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, msg)
}

func (h *ChatHandler) UpdateMessage(c *gin.Context) {
	userID, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	messageID, err := parseID(c.Param("message_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid message id"})
		return
	}

	var req struct {
		Text string `json:"text" binding:"required,min=1,max=5000"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	msg, err := h.Service.UpdateMessage(userID, messageID, req.Text)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, msg)
}

func (h *ChatHandler) DeleteMessage(c *gin.Context) {
	userID, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	messageID, err := parseID(c.Param("message_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid message id"})
		return
	}

	if err := h.Service.DeleteMessage(userID, messageID); err != nil {
		writeServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ChatHandler) MarkRead(c *gin.Context) {
	userID, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	chatID, err := parseID(c.Param("chat_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid chat id"})
		return
	}

	if err := h.Service.MarkRead(userID, chatID); err != nil {
		writeServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "messages marked as read"})
}

func (h *ChatHandler) PropertyChatStats(c *gin.Context) {
	propertyID, err := parseID(c.Param("property_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid property id"})
		return
	}

	stats, err := h.Service.PropertyStats(propertyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to get stats"})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func writeServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, services.ErrNotFound):
		c.JSON(http.StatusNotFound, gin.H{"message": "not found"})
	case errors.Is(err, services.ErrForbidden):
		c.JSON(http.StatusForbidden, gin.H{"message": "forbidden"})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"message": "internal error"})
	}
}

func parseID(s string) (uint, error) {
	v, err := strconv.ParseUint(s, 10, 64)
	return uint(v), err
}

func pagination(c *gin.Context, defaultLimit, maxLimit int) (int, int) {
	limit, offset := defaultLimit, 0
	if v := c.Query("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 && n <= maxLimit {
			limit = n
		}
	}
	if v := c.Query("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			offset = n
		}
	}
	return limit, offset
}
