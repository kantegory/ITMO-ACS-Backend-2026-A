package view

import (
	"github.com/gin-gonic/gin"

	"recipe-lab1/internal/model"
)

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

func Error(c *gin.Context, status int, code string, message string, details ...model.ErrorDetail) {
	JSON(c, status, model.ErrorResponse{
		Error: model.ErrorBody{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}
