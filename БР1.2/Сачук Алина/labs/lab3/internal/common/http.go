package common

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
)

func NewRouter() *gin.Engine {
	router := gin.Default()
	router.HandleMethodNotAllowed = true
	router.NoMethod(func(c *gin.Context) {
		Error(c, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "method not allowed")
	})
	router.NoRoute(func(c *gin.Context) {
		Error(c, http.StatusNotFound, "NOT_FOUND", "route not found")
	})
	return router
}

func Health(service string) gin.HandlerFunc {
	return func(c *gin.Context) {
		JSON(c, http.StatusOK, map[string]string{"service": service, "status": "ok"})
	}
}

func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

func JSON(c *gin.Context, status int, payload any) {
	if payload != nil {
		c.JSON(status, payload)
		return
	}
	c.Status(status)
}

func Empty(c *gin.Context, status int) {
	c.Status(status)
}

func Error(c *gin.Context, status int, code string, message string) {
	JSON(c, status, ErrorResponse{Error: ErrorBody{Code: code, Message: message}})
}

func Decode(c *gin.Context, target any) error {
	defer c.Request.Body.Close()
	decoder := json.NewDecoder(c.Request.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(target)
}
