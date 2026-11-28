package routes

import (
	"rental-platform/services/chat-service/internal/handlers"
	sharedmw "rental-platform/shared/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(r *gin.Engine, h *handlers.ChatHandler, jwtSecret string) {
	r.GET("/health", h.Health)

	auth := r.Group("/")
	auth.Use(sharedmw.JWTAuth(jwtSecret))
	{
		auth.GET("/chats", h.ListChats)
		auth.POST("/chats", h.CreateChat)
		auth.GET("/chats/:chat_id", h.GetChat)
		auth.DELETE("/chats/:chat_id", h.DeleteChat)
		auth.GET("/chats/:chat_id/messages", h.ListMessages)
		auth.POST("/chats/:chat_id/messages", h.SendMessage)
		auth.PATCH("/chats/:chat_id/read", h.MarkRead)
		auth.PATCH("/messages/:message_id", h.UpdateMessage)
		auth.DELETE("/messages/:message_id", h.DeleteMessage)
	}

	r.GET("/internal/chats/property/:property_id", h.PropertyChatStats)
}
