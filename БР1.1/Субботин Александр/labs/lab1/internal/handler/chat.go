package handler

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/ZZISST/rental-api/internal/middleware"
	"github.com/ZZISST/rental-api/internal/model"
	"github.com/ZZISST/rental-api/internal/repository"
)

type ChatHandler struct {
	chatRepo *repository.ChatRepository
}

func NewChatHandler(chatRepo *repository.ChatRepository) *ChatHandler {
	return &ChatHandler{chatRepo: chatRepo}
}

// ListChats godoc
// @Summary      Список чатов пользователя
// @Tags         chats
// @Produce      json
// @Security     BearerAuth
// @Param        limit  query integer false "Лимит"  default(20)
// @Param        offset query integer false "Смещение" default(0)
// @Success      200 {object} model.PaginatedResponse
// @Failure      401 {object} model.ErrorResponse
// @Router       /chats [get]
func (h *ChatHandler) ListChats(c *gin.Context) {
	userID := middleware.GetUserID(c)
	limit := 20
	offset := 0
	if l, ok := c.GetQuery("limit"); ok {
		fmt.Sscanf(l, "%d", &limit)
	}
	if o, ok := c.GetQuery("offset"); ok {
		fmt.Sscanf(o, "%d", &offset)
	}

	chats, total, err := h.chatRepo.ListByUser(userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}

	c.JSON(http.StatusOK, model.PaginatedResponse{
		Items:      chats,
		Pagination: model.Pagination{Limit: limit, Offset: offset, Total: total},
	})
}

// GetMessages godoc
// @Summary      Сообщения чата
// @Tags         chats
// @Produce      json
// @Security     BearerAuth
// @Param        chatId path    string  true  "ID чата"
// @Param        limit  query   integer false "Лимит"  default(50)
// @Param        offset query   integer false "Смещение" default(0)
// @Success      200 {object} model.PaginatedResponse
// @Failure      403 {object} model.ErrorResponse "Не участник чата"
// @Router       /chats/{chatId}/messages [get]
func (h *ChatHandler) GetMessages(c *gin.Context) {
	chatID := c.Param("chatId")
	userID := middleware.GetUserID(c)

	ok, err := h.chatRepo.IsParticipant(chatID, userID)
	if err != nil || !ok {
		c.JSON(http.StatusForbidden, model.ErrorResponse{Code: 403, Message: "you are not a participant of this chat"})
		return
	}

	limit := 50
	offset := 0
	if l, ok := c.GetQuery("limit"); ok {
		fmt.Sscanf(l, "%d", &limit)
	}
	if o, ok := c.GetQuery("offset"); ok {
		fmt.Sscanf(o, "%d", &offset)
	}

	messages, total, err := h.chatRepo.GetMessages(chatID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}

	c.JSON(http.StatusOK, model.PaginatedResponse{
		Items:      messages,
		Pagination: model.Pagination{Limit: limit, Offset: offset, Total: total},
	})
}

// SendMessage godoc
// @Summary      Отправить сообщение
// @Tags         chats
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        chatId path string              true "ID чата"
// @Param        body   body model.SendMessageRequest true "Текст сообщения"
// @Success      201 {object} model.Message
// @Failure      400 {object} model.ErrorResponse
// @Failure      403 {object} model.ErrorResponse "Не участник чата"
// @Router       /chats/{chatId}/messages [post]
func (h *ChatHandler) SendMessage(c *gin.Context) {
	chatID := c.Param("chatId")
	userID := middleware.GetUserID(c)

	ok, err := h.chatRepo.IsParticipant(chatID, userID)
	if err != nil || !ok {
		c.JSON(http.StatusForbidden, model.ErrorResponse{Code: 403, Message: "you are not a participant of this chat"})
		return
	}

	var req model.SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Code: 400, Message: "invalid request", Details: err.Error()})
		return
	}

	msg, err := h.chatRepo.SendMessage(chatID, userID, req.Text)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "failed to send message"})
		return
	}

	c.JSON(http.StatusCreated, msg)
}
