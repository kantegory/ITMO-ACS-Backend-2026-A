package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"log"
)

func LoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		duration := time.Since(start)
		status := c.Writer.Status()
		log.Printf("[%s] %s %s %d %v", c.ClientIP(), c.Request.Method, c.Request.URL.Path, status, duration)
	}
}